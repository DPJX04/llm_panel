/*
 * The validation gate for everything the panel reads: vLLM `bench serve` result files
 * (JSON, JSON Lines, or JSON inside a Markdown code fence) and saved workspace files.
 * Nothing past this file sees an unchecked value.
 */
BenchPanel.define('services/resultParser', [
  'types/result', 'types/benchmarkRun', 'config/appConfig', 'utils/errorMessage', 'utils/modelNaming',
], (result, benchmarkRun, appConfig, errorMessage, modelNaming) => {
  'use strict';

  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
  const REQUIRED_NUMBERS = ['completed', 'request_throughput', 'output_throughput', 'mean_ttft_ms', 'mean_tpot_ms', 'mean_e2el_ms'];

  function num(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function nonNegative(value) {
    const n = num(value);
    return n !== null && n >= 0 ? n : null;
  }

  function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function readStats(raw, name) {
    const stats = {};
    benchmarkRun.LATENCY_STAT_KEYS.forEach((stat) => { stats[stat] = num(raw[`${stat}_${name}_ms`]); });
    if (stats.median === null) stats.median = stats.p50;
    if (stats.p50 === null) stats.p50 = stats.median;
    return stats;
  }

  /** @returns {import('../types/result').Result<import('../types/benchmarkRun').BenchmarkRun>} */
  function toRun(raw, sourceFile) {
    if (!isPlainObject(raw)) return result.fail('record is not a JSON object');
    const missing = REQUIRED_NUMBERS.filter((field) => num(raw[field]) === null);
    if (typeof raw.model_id !== 'string' || raw.model_id.trim() === '') missing.unshift('model_id');
    if (missing.length > 0) return result.fail(`missing ${missing.join(', ')}`);

    const concurrency = raw.max_concurrency === null || raw.max_concurrency === undefined ? null : num(raw.max_concurrency);
    if (concurrency !== null && concurrency <= 0) return result.fail('max_concurrency must be positive');

    const modelId = raw.model_id.trim();
    const label = typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label.trim() : null;
    const modelKey = modelNaming.modelKeyFor(modelId, label);
    const date = typeof raw.date === 'string' ? raw.date : '';
    const failed = nonNegative(raw.failed) || 0;

    return result.ok({
      id: `${modelKey}@@${concurrency}@@${date}`,
      modelKey,
      modelId,
      label,
      concurrency,
      date,
      sourceFile,
      numPrompts: nonNegative(raw.num_prompts) || raw.completed + failed,
      completed: raw.completed,
      failed,
      durationS: nonNegative(raw.duration),
      totalInputTokens: nonNegative(raw.total_input_tokens),
      totalOutputTokens: nonNegative(raw.total_output_tokens),
      requestThroughput: raw.request_throughput,
      outputThroughput: raw.output_throughput,
      totalTokenThroughput: num(raw.total_token_throughput),
      peakOutputTokensPerS: num(raw.max_output_tokens_per_s),
      ttft: readStats(raw, 'ttft'),
      tpot: readStats(raw, 'tpot'),
      itl: readStats(raw, 'itl'),
      e2el: readStats(raw, 'e2el'),
      raw,
    });
  }

  /** Every JSON value the text holds: one document, fenced blocks in Markdown, or one per line. */
  function readJsonValues(text) {
    const trimmed = text.replace(BYTE_ORDER_MARK, '').trim();
    if (trimmed === '') throw new Error('File is empty');
    try {
      return [JSON.parse(trimmed)];
    } catch (wholeFileError) {
      const fenced = Array.from(trimmed.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g), (match) => match[1].trim());
      const chunks = fenced.length > 0 ? fenced : trimmed.split(/\r?\n/).filter((line) => line.trim() !== '');
      if (chunks.length < 2 && fenced.length === 0) throw wholeFileError;
      return chunks.map((chunk) => JSON.parse(chunk));
    }
  }

  function toProfile(raw) {
    const profile = benchmarkRun.createModelProfile();
    if (!isPlainObject(raw)) return profile;
    if (typeof raw.shortName === 'string') profile.shortName = raw.shortName.trim().slice(0, appConfig.maxShortNameLength);
    benchmarkRun.PROFILE_NUMBER_FIELDS.forEach((field) => { profile[field] = nonNegative(raw[field]); });
    if (profile.gpuUtilPct !== null && profile.gpuUtilPct > 100) profile.gpuUtilPct = null;
    return profile;
  }

  function isWorkspace(value) {
    return isPlainObject(value) && value.kind === appConfig.workspaceFileKind;
  }

  /**
   * @returns {import('../types/result').Result<{ runs: Object[], profiles: Object, modelOrder: string[], warnings: string[] }>}
   */
  function parseWorkspace(value) {
    if (!isWorkspace(value) || !Array.isArray(value.records)) return result.fail('Not a Benchmark Panel workspace file');
    const runs = [];
    const warnings = [];
    value.records.forEach((record, index) => {
      const sourceFile = isPlainObject(record) && typeof record.sourceFile === 'string' ? record.sourceFile : 'workspace';
      const run = toRun(isPlainObject(record) ? record.data : null, sourceFile);
      if (run.ok) runs.push(run.data);
      else warnings.push(`Workspace record ${index + 1}: ${run.error}`);
    });
    const profiles = {};
    if (isPlainObject(value.profiles)) {
      Object.keys(value.profiles).forEach((key) => { profiles[key] = toProfile(value.profiles[key]); });
    }
    const modelOrder = Array.isArray(value.modelOrder) ? value.modelOrder.filter((key) => typeof key === 'string') : [];
    return result.ok({ runs, profiles, modelOrder, warnings });
  }

  /**
   * @param {string} text
   * @param {string} fileName
   * @returns {import('../types/result').Result<{ runs: Object[], workspace: Object|null, warnings: string[] }>}
   */
  function parseResultText(text, fileName) {
    let values;
    try {
      values = readJsonValues(text);
    } catch (cause) {
      return result.fail(`${fileName}: ${errorMessage.toErrorMessage(cause)}`);
    }

    if (values.length === 1 && isWorkspace(values[0])) {
      const workspace = parseWorkspace(values[0]);
      if (!workspace.ok) return result.fail(`${fileName}: ${workspace.error}`);
      return result.ok({ runs: [], workspace: workspace.data, warnings: workspace.data.warnings.map((w) => `${fileName}: ${w}`) });
    }

    const records = values.flatMap((value) => (Array.isArray(value) ? value : [value]));
    const runs = [];
    const warnings = [];
    records.forEach((record, index) => {
      const run = toRun(record, fileName);
      if (run.ok) runs.push(run.data);
      else warnings.push(`${fileName}${records.length > 1 ? ` record ${index + 1}` : ''}: ${run.error}`);
    });
    if (runs.length === 0) return result.fail(warnings[0] || `${fileName}: no benchmark results found`);
    return result.ok({ runs, workspace: null, warnings });
  }

  return { parseResultText, parseWorkspace, toProfile };
});
