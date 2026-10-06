/*
 * App-wide state: the loaded runs, the accuracy evaluation reports, each model's profile, and the order models were
 * first seen in (which fixes each model's chart colour). Saves itself after every change.
 */
BenchPanel.define('store/workspaceStore', [
  'types/benchmarkRun', 'utils/runCollection', 'utils/evalReportCollection', 'utils/modelNaming',
  'services/workspaceStorageService',
], (benchmarkRun, runCollection, evalReportCollection, modelNaming, storage) => {
  'use strict';

  const SERIES_SLOTS = 8;
  const EMPTY = Object.freeze({ runs: [], evalReports: [], profiles: {}, modelOrder: [] });

  let state = EMPTY;
  let storageError = null;
  const listeners = new Set();

  function commit(next) {
    state = next;
    const saved = storage.save(state);
    storageError = saved.ok ? null : saved.error;
    listeners.forEach((listener) => listener(state));
  }

  /** Keeps the existing order (and so each model's colour) and appends models seen for the first time. */
  function withModelOrder(runs, evalReports, previousOrder) {
    const keys = runs.map((run) => run.modelKey).concat(evalReports.map((report) => report.modelKey));
    const present = new Set(keys);
    const kept = previousOrder.filter((key) => present.has(key));
    keys.forEach((key) => { if (!kept.includes(key)) kept.push(key); });
    return kept;
  }

  function withItems(runs, evalReports, profiles, previousOrder) {
    return { runs, evalReports, profiles, modelOrder: withModelOrder(runs, evalReports, previousOrder) };
  }

  /** Loads the workspace saved in this browser, if any. */
  function init() {
    const loaded = storage.load();
    if (!loaded.ok) { storageError = loaded.error; return; }
    if (loaded.data) {
      const runs = runCollection.mergeRuns([], loaded.data.runs).runs;
      const evalReports = evalReportCollection.mergeEvalReports([], loaded.data.evalReports).reports;
      state = withItems(runs, evalReports, loaded.data.profiles, loaded.data.modelOrder);
    }
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getState() {
    return state;
  }

  function getStorageError() {
    return storageError;
  }

  /**
   * Adds parsed runs, evaluation reports and workspace files.
   * @returns {{ added: number, replaced: number, skipped: number,
   *   reports: { added: number, replaced: number, skipped: number } }}
   */
  function importResults(runs, workspaces, evalReports) {
    const profiles = { ...state.profiles };
    let order = state.modelOrder;
    const incomingRuns = [];
    const incomingReports = [];
    workspaces.forEach((workspace) => {
      Object.assign(profiles, workspace.profiles);
      order = order.concat(workspace.modelOrder.filter((key) => !order.includes(key)));
      incomingRuns.push(...workspace.runs);
      incomingReports.push(...workspace.evalReports);
    });
    incomingRuns.push(...runs);
    incomingReports.push(...(evalReports || []));
    const mergedRuns = runCollection.mergeRuns(state.runs, incomingRuns);
    const mergedReports = evalReportCollection.mergeEvalReports(state.evalReports, incomingReports);
    commit(withItems(mergedRuns.runs, mergedReports.reports, profiles, order));
    return {
      added: mergedRuns.added,
      replaced: mergedRuns.replaced,
      skipped: mergedRuns.skipped,
      reports: { added: mergedReports.added, replaced: mergedReports.replaced, skipped: mergedReports.skipped },
    };
  }

  /** Adds the report of an accuracy run that just finished. The caller passes a report that went through the validation gate. */
  function addEvalReport(report) {
    const merged = evalReportCollection.mergeEvalReports(state.evalReports, [report]);
    commit(withItems(state.runs, merged.reports, state.profiles, state.modelOrder));
  }

  function removeRun(runId) {
    commit(withItems(state.runs.filter((run) => run.id !== runId), state.evalReports, state.profiles, state.modelOrder));
  }

  function removeEvalReport(reportId) {
    commit(withItems(state.runs, state.evalReports.filter((report) => report.id !== reportId), state.profiles, state.modelOrder));
  }

  /** Removes the model's runs and evaluation reports. */
  function removeModel(modelKey) {
    commit(withItems(
      state.runs.filter((run) => run.modelKey !== modelKey),
      state.evalReports.filter((report) => report.modelKey !== modelKey),
      state.profiles, state.modelOrder));
  }

  function clearAll() {
    storage.clear();
    commit(EMPTY);
  }

  /**
   * Replaces a model's profile. The caller passes a profile that went through the validation gate.
   * @param {string} modelKey  @param {import('../types/benchmarkRun').ModelProfile} profile
   */
  function setProfile(modelKey, profile) {
    commit({ ...state, profiles: { ...state.profiles, [modelKey]: profile } });
  }

  /**
   * Every model with runs or evaluation reports, in fixed order, each with its display name,
   * colour slot (1-8, or 0 past eight) and profile.
   * @returns {Array<{ key: string, modelId: string, label: string|null, name: string, colorSlot: number, profile: Object,
   *   hasRuns: boolean, hasEvalReports: boolean }>}
   */
  function getAllModels() {
    const models = state.modelOrder.map((key) => {
      const source = state.runs.find((run) => run.modelKey === key) || state.evalReports.find((report) => report.modelKey === key);
      return { key, modelId: source.modelId, label: source.label };
    });
    const defaults = modelNaming.defaultShortNames(models);
    return models.map((model, index) => {
      const profile = state.profiles[model.key] || benchmarkRun.createModelProfile();
      return {
        ...model,
        name: profile.shortName || defaults[model.key],
        colorSlot: index < SERIES_SLOTS ? index + 1 : 0,
        profile,
        hasRuns: state.runs.some((run) => run.modelKey === model.key),
        hasEvalReports: state.evalReports.some((report) => report.modelKey === model.key),
      };
    });
  }

  /** The models that have benchmark runs; what the speed views compare. */
  function getModels() {
    return getAllModels().filter((model) => model.hasRuns);
  }

  return {
    init, subscribe, getState, getStorageError, importResults, addEvalReport, removeRun, removeEvalReport, removeModel,
    clearAll, setProfile, getModels, getAllModels,
  };
});
