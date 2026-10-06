/*
 * Runs an accuracy evaluation from the browser: checks the pasted server, asks the chosen questions (as many at once
 * as the user allows, each as often as the repeats say), grades the replies and saves the report.
 * Holds the form and the run's progress for the view; a stopped run saves nothing, so a partial run never replaces a full one.
 */
BenchPanel.define('features/accuracy/runController', [
  'constants/evalRunDefaults', 'services/modelEndpointService', 'services/evalReportParser', 'services/preferencesService',
  'store/workspaceStore', 'utils/endpointUrl', 'utils/promptBuilder', 'utils/evalCaseBuilder', 'utils/evalReportBuilder',
  'utils/evalSummary', 'utils/numberFormat', 'utils/runSettings', 'utils/questionFilter', 'utils/taskPool',
], (evalRunDefaults, modelEndpointService, evalReportParser, preferencesService, workspaceStore, endpointUrl, promptBuilder,
  evalCaseBuilder, evalReportBuilder, evalSummary, numberFormat, runSettings, questionFilter, taskPool) => {
  'use strict';

  const BASE_URL_PREFERENCE = 'accuracy.baseUrl';
  // Stop early when the server fails this many questions before any succeeds.
  const MAX_LEADING_ERRORS = 3;

  function percent(value) {
    return numberFormat.formatWithUnit((value || 0) * 100, 0, '%');
  }

  /** @param {() => void} onChange  called whenever the view should redraw */
  function createRunController(onChange) {
    const { DEFAULTS } = evalRunDefaults;
    const state = {
      baseUrlText: String(preferencesService.load(BASE_URL_PREFERENCE, '') || ''),
      apiKey: '',
      baseUrl: null,
      served: [],
      servedName: '',
      modelId: '',
      label: '',
      // Settings stay as typed until a run starts; runSettings checks them then.
      temperature: String(DEFAULTS.temperature),
      maxTokens: String(DEFAULTS.maxTokens),
      repeats: String(DEFAULTS.repeats),
      concurrency: String(DEFAULTS.concurrency),
      timeoutS: String(DEFAULTS.timeoutS),
      limit: '',
      systemPrompt: DEFAULTS.systemPrompt,
      excludedKinds: [],
      excludedCategories: [],
      checking: false,
      running: false,
      progress: null,
      notice: null,
    };
    let controller = null;

    function getState() {
      return state;
    }

    /** Typing keeps its own value, so no redraw unless asked (e.g. when the question count shown depends on it). */
    function setField(name, value, redraw) {
      state[name] = value;
      if (redraw) onChange();
    }

    /** @param {'excludedKinds'|'excludedCategories'} list */
    function toggleExcluded(list, value) {
      state[list] = state[list].includes(value) ? state[list].filter((item) => item !== value) : state[list].concat(value);
      onChange();
    }

    /** A new question set starts with all of its questions picked. */
    function resetQuestionFilter() {
      state.excludedKinds = [];
      state.excludedCategories = [];
      state.limit = '';
    }

    /** The questions a run would ask, from the filter as it stands. */
    function plan(questionSet) {
      const limit = Number(state.limit);
      return questionFilter.filterQuestions(questionSet, {
        excludedKinds: state.excludedKinds,
        excludedCategories: state.excludedCategories,
        limit: String(state.limit).trim() !== '' && Number.isInteger(limit) && limit > 0 ? limit : null,
      });
    }

    function selectServed(servedName) {
      const model = state.served.find((candidate) => candidate.servedName === servedName);
      state.servedName = servedName;
      state.modelId = model ? model.root || model.servedName : '';
      onChange();
    }

    async function checkEndpoint() {
      const baseUrl = endpointUrl.normalizeBaseUrl(state.baseUrlText);
      if (!baseUrl) {
        state.notice = { tone: 'error', title: 'Enter the server URL, e.g. http://localhost:8003/v1', lines: [] };
        onChange();
        return;
      }
      state.checking = true;
      state.notice = null;
      onChange();
      const listed = await modelEndpointService.listModels(baseUrl, state.apiKey);
      state.checking = false;
      if (!listed.ok) {
        state.served = [];
        state.baseUrl = null;
        state.notice = { tone: 'error', title: 'Could not list the models', lines: [listed.error] };
        onChange();
        return;
      }
      state.baseUrl = baseUrl;
      state.baseUrlText = baseUrl;
      state.served = listed.data;
      preferencesService.save(BASE_URL_PREFERENCE, baseUrl);
      const keep = listed.data.find((model) => model.servedName === state.servedName);
      selectServed(keep ? keep.servedName : listed.data[0].servedName);
    }

    function finishNotice(report) {
      const summary = evalSummary.summarizeReport(report);
      const lines = [];
      if (summary.accuracyRange) lines.push(`Across the ${summary.repeats} repeats, accuracy ranged from ${percent(summary.accuracyRange.min)} to ${percent(summary.accuracyRange.max)}.`);
      if (summary.errors > 0) lines.push(`${summary.errors} request${summary.errors === 1 ? '' : 's'} got no reply and are left out of the scores.`);
      if (summary.truncated > 0) lines.push(`${summary.truncated} repl${summary.truncated === 1 ? 'y' : 'ies'} hit the ${numberFormat.formatNumber(report.settings.maxTokens, 0)}-token limit. Raise "Max tokens" if the model reasons at length.`);
      return {
        tone: summary.errors > 0 || summary.truncated > 0 ? 'warning' : 'success',
        title: `${report.servedName}: ${percent(summary.accuracy)} correct on ${report.questionSetTitle}, `
          + `${numberFormat.formatNumber((summary.meanTotalMs || 0) / 1000, 1)} s per question.`,
        lines,
      };
    }

    function saveReport(questionSet, subset, settings, cases, createdAt) {
      const raw = evalReportBuilder.buildReportFile({
        modelId: state.modelId.trim() || state.servedName,
        label: state.label.trim() || null,
        servedName: state.servedName,
        baseUrl: state.baseUrl,
        questionSet: { id: questionSet.id, title: questionSet.title, subset },
        settings,
        cases,
        createdAt,
      });
      const report = evalReportParser.toEvalReport(raw, 'run in panel');
      if (!report.ok) return { tone: 'error', title: 'The run could not be saved', lines: [report.error] };
      workspaceStore.addEvalReport(report.data);
      return finishNotice(report.data);
    }

    /** @param {import('../../types/questionSet').QuestionSet} questionSet */
    async function start(questionSet) {
      if (state.running || !state.baseUrl || !state.servedName) return;
      const checked = runSettings.validateRunSettings(state);
      if (!checked.ok) {
        state.notice = { tone: 'error', title: 'Fix these settings first', lines: checked.error.split('\n') };
        onChange();
        return;
      }
      const settings = checked.data;
      const { questions, subset } = plan(questionSet);
      if (questions.length === 0) {
        state.notice = { tone: 'error', title: 'No questions are picked. Tick at least one kind and one category.', lines: [] };
        onChange();
        return;
      }

      // Pass 1 asks every question, then pass 2, and so on, so an early stop still covers the whole set once.
      const jobs = [];
      for (let attempt = 1; attempt <= settings.repeats; attempt += 1) questions.forEach((question) => jobs.push({ question, attempt }));
      controller = new AbortController();
      const createdAt = new Date().toISOString();
      const cases = new Array(jobs.length);
      let stopReason = null;
      state.running = true;
      state.notice = null;
      state.progress = { done: 0, total: jobs.length, correct: 0, errors: 0, current: '' };
      onChange();

      await taskPool.runPool(jobs, settings.concurrency, async ({ question, attempt }, index) => {
        state.progress.current = question.question;
        onChange();
        const reply = await modelEndpointService.streamChat({
          baseUrl: state.baseUrl,
          apiKey: state.apiKey,
          servedName: state.servedName,
          messages: promptBuilder.buildMessages(question, settings.systemPrompt),
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          timeoutMs: settings.timeoutS * 1000,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return true;
        const graded = reply.ok
          ? evalCaseBuilder.buildCase(question, reply.data, attempt)
          : evalCaseBuilder.buildErrorCase(question, reply.error, attempt);
        cases[index] = graded;
        state.progress.done += 1;
        if (graded.outcome === 'correct') state.progress.correct += 1;
        if (graded.outcome === 'error') state.progress.errors += 1;
        onChange();
        if (state.progress.errors >= MAX_LEADING_ERRORS && state.progress.errors === state.progress.done) {
          stopReason = graded.error;
          return true;
        }
        return false;
      }, controller.signal);

      const finished = cases.filter(Boolean);
      state.running = false;
      state.progress = null;
      if (controller.signal.aborted) {
        state.notice = { tone: 'info', title: 'Run stopped. Nothing was saved.', lines: [] };
      } else if (stopReason || finished.every((graded) => graded.outcome === 'error')) {
        state.notice = { tone: 'error', title: 'The server failed every question, so nothing was saved',
          lines: [stopReason || finished[0].error] };
      } else {
        state.notice = saveReport(questionSet, subset, settings, finished, createdAt);
      }
      controller = null;
      onChange();
    }

    function stop() {
      if (controller) controller.abort(new Error('Stopped'));
    }

    return { getState, setField, toggleExcluded, resetQuestionFilter, plan, selectServed, checkEndpoint, start, stop };
  }

  return { createRunController };
});
