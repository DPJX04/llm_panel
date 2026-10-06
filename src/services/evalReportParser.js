/*
 * The validation gate for evaluation reports: ones the panel just produced, ones saved in the workspace,
 * and report files a user loads. Nothing past this file sees an unchecked value.
 */
BenchPanel.define('services/evalReportParser', [
  'types/result', 'types/evalReport', 'types/questionSet', 'config/appConfig',
  'utils/modelNaming', 'utils/evalReportBuilder',
], (result, evalReport, questionSet, appConfig, modelNaming, evalReportBuilder) => {
  'use strict';

  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

  function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function optionalText(value) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
  }

  function nonNegative(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
  }

  /** A score from 0 to 1, or null. */
  function share(value) {
    const number = nonNegative(value);
    return number !== null && number <= 1 ? number : null;
  }

  function positiveWhole(value) {
    return Number.isInteger(value) && value >= 1 ? value : null;
  }

  /** Older reports hold only temperature and max tokens; the rest default to a plain one-at-a-time run. */
  function toSettings(raw) {
    const settings = isPlainObject(raw) ? raw : {};
    return {
      temperature: nonNegative(settings.temperature),
      maxTokens: nonNegative(settings.maxTokens),
      repeats: positiveWhole(settings.repeats) || 1,
      concurrency: positiveWhole(settings.concurrency) || 1,
      timeoutS: nonNegative(settings.timeoutS),
      systemPrompt: typeof settings.systemPrompt === 'string' ? settings.systemPrompt.trim() : '',
    };
  }

  function toSubset(raw) {
    if (!isPlainObject(raw)) return null;
    const key = text(raw.key);
    const label = text(raw.label);
    return key && label ? { key, label } : null;
  }

  function isEvalReport(value) {
    return isPlainObject(value) && value.kind === evalReport.EVAL_REPORT_KIND;
  }

  /** @returns {import('../types/result').Result<import('../types/evalReport').EvalCase>} */
  function toCase(raw, index) {
    if (!isPlainObject(raw)) return result.fail(`case ${index + 1} is not an object`);
    const id = text(String(raw.id ?? ''));
    if (id === '') return result.fail(`case ${index + 1} has no id`);
    if (!questionSet.QUESTION_KINDS.includes(raw.kind)) return result.fail(`case ${id}: unknown kind "${raw.kind}"`);
    if (!evalReport.OUTCOMES.includes(raw.outcome)) return result.fail(`case ${id}: unknown outcome "${raw.outcome}"`);
    return result.ok({
      id,
      attempt: positiveWhole(raw.attempt) || 1,
      kind: raw.kind,
      category: text(raw.category) || 'general',
      question: text(raw.question),
      text: text(raw.text).slice(0, appConfig.maxSavedAnswerLength),
      choices: Array.isArray(raw.choices) ? raw.choices.filter((choice) => typeof choice === 'string') : [],
      reference: text(String(raw.reference ?? '')),
      answerable: raw.answerable !== false,
      maxWords: positiveWhole(raw.maxWords),
      answer: text(raw.answer).slice(0, appConfig.maxSavedAnswerLength),
      outcome: raw.outcome,
      extracted: raw.extracted === null || raw.extracted === undefined ? null : text(String(raw.extracted)) || null,
      formatFollowed: raw.formatFollowed === true,
      coverage: share(raw.coverage),
      rougeL: share(raw.rougeL),
      wordCount: nonNegative(raw.wordCount),
      error: optionalText(raw.error),
      totalMs: nonNegative(raw.totalMs),
      ttftMs: nonNegative(raw.ttftMs),
      inputTokens: nonNegative(raw.inputTokens),
      outputTokens: nonNegative(raw.outputTokens),
      finishReason: optionalText(raw.finishReason),
    });
  }

  /**
   * @param {unknown} value
   * @param {string} sourceFile
   * @returns {import('../types/result').Result<import('../types/evalReport').EvalReport>}
   */
  function toEvalReport(value, sourceFile) {
    if (!isEvalReport(value)) return result.fail('Not an evaluation report');
    if (value.version !== evalReport.EVAL_REPORT_VERSION) return result.fail(`Unsupported evaluation report version ${value.version}`);
    const model = isPlainObject(value.model) ? value.model : {};
    const set = isPlainObject(value.questionSet) ? value.questionSet : {};
    const modelId = text(model.id);
    const baseSetId = text(set.id);
    const createdAt = text(value.createdAt);
    if (modelId === '') return result.fail('the report does not name its model');
    if (baseSetId === '') return result.fail('the report does not name its question set');
    if (Number.isNaN(Date.parse(createdAt))) return result.fail('the report has no valid createdAt time');
    if (!Array.isArray(value.cases) || value.cases.length === 0) return result.fail('the report has no cases');

    const cases = [];
    for (let index = 0; index < value.cases.length; index += 1) {
      const parsed = toCase(value.cases[index], index);
      if (!parsed.ok) return parsed;
      cases.push(parsed.data);
    }
    const label = optionalText(model.label);
    const subset = toSubset(set.subset);
    const baseTitle = text(set.title) || baseSetId;
    const run = {
      modelId,
      label,
      servedName: text(model.servedName) || modelId,
      baseUrl: text(model.baseUrl),
      questionSet: { id: baseSetId, title: baseTitle, subset },
      settings: toSettings(value.settings),
      cases,
      createdAt,
    };
    const modelKey = modelNaming.modelKeyFor(modelId, label);
    // Part of a set is filed apart from the whole set, so a quick check never replaces a full run.
    const questionSetId = subset ? `${baseSetId}@${subset.key}` : baseSetId;
    return result.ok({
      id: `${modelKey}@@${questionSetId}@@${createdAt}`,
      modelKey,
      modelId,
      label,
      servedName: run.servedName,
      baseUrl: run.baseUrl,
      questionSetId,
      questionSetTitle: subset ? `${baseTitle} (${subset.label})` : baseTitle,
      subset,
      createdAt,
      settings: run.settings,
      cases,
      sourceFile,
      // The cleaned report, which is what gets saved and exported.
      raw: evalReportBuilder.buildReportFile(run),
    });
  }

  /**
   * @returns {import('../types/result').Result<import('../types/evalReport').EvalReport>|null}
   *   null when the text is not an evaluation report at all, so the caller can try other formats
   */
  function parseEvalReportText(rawText, fileName) {
    let value;
    try {
      value = JSON.parse(String(rawText).replace(BYTE_ORDER_MARK, ''));
    } catch (cause) {
      return null;
    }
    if (!isEvalReport(value)) return null;
    const parsed = toEvalReport(value, fileName);
    return parsed.ok ? parsed : result.fail(`${fileName}: ${parsed.error}`);
  }

  return { isEvalReport, toEvalReport, parseEvalReportText };
});
