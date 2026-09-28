/*
 * App-wide state: the loaded runs, each model's profile, and the order models were first seen in
 * (which fixes each model's chart colour). Saves itself after every change.
 */
BenchPanel.define('store/workspaceStore', [
  'types/benchmarkRun', 'utils/runCollection', 'utils/modelNaming', 'services/workspaceStorageService',
], (benchmarkRun, runCollection, modelNaming, storage) => {
  'use strict';

  const SERIES_SLOTS = 8;

  let state = { runs: [], profiles: {}, modelOrder: [] };
  let storageError = null;
  const listeners = new Set();

  function commit(next) {
    state = next;
    const saved = storage.save(state);
    storageError = saved.ok ? null : saved.error;
    listeners.forEach((listener) => listener(state));
  }

  function withModelOrder(runs, previousOrder) {
    const present = new Set(runs.map((run) => run.modelKey));
    const kept = previousOrder.filter((key) => present.has(key));
    runs.forEach((run) => { if (!kept.includes(run.modelKey)) kept.push(run.modelKey); });
    return kept;
  }

  /** Loads the workspace saved in this browser, if any. */
  function init() {
    const loaded = storage.load();
    if (!loaded.ok) { storageError = loaded.error; return; }
    if (loaded.data) {
      const runs = runCollection.mergeRuns([], loaded.data.runs).runs;
      state = { runs, profiles: loaded.data.profiles, modelOrder: withModelOrder(runs, loaded.data.modelOrder) };
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
   * Adds parsed runs and workspace files.
   * @returns {{ added: number, replaced: number, skipped: number }}
   */
  function importResults(runs, workspaces) {
    const profiles = { ...state.profiles };
    let order = state.modelOrder;
    const incoming = [];
    workspaces.forEach((workspace) => {
      Object.assign(profiles, workspace.profiles);
      order = order.concat(workspace.modelOrder.filter((key) => !order.includes(key)));
      incoming.push(...workspace.runs);
    });
    incoming.push(...runs);
    const merged = runCollection.mergeRuns(state.runs, incoming);
    commit({ runs: merged.runs, profiles, modelOrder: withModelOrder(merged.runs, order) });
    return { added: merged.added, replaced: merged.replaced, skipped: merged.skipped };
  }

  function removeRun(runId) {
    const runs = state.runs.filter((run) => run.id !== runId);
    commit({ ...state, runs, modelOrder: withModelOrder(runs, state.modelOrder) });
  }

  function removeModel(modelKey) {
    const runs = state.runs.filter((run) => run.modelKey !== modelKey);
    commit({ ...state, runs, modelOrder: withModelOrder(runs, state.modelOrder) });
  }

  function clearAll() {
    storage.clear();
    commit({ runs: [], profiles: {}, modelOrder: [] });
  }

  /** @param {string} modelKey  @param {Partial<import('../types/benchmarkRun').ModelProfile>} patch */
  function updateProfile(modelKey, patch) {
    const current = state.profiles[modelKey] || benchmarkRun.createModelProfile();
    commit({ ...state, profiles: { ...state.profiles, [modelKey]: { ...current, ...patch } } });
  }

  /**
   * The models in fixed order, each with its display name, colour slot (1-8, or 0 past eight) and profile.
   * @returns {Array<{ key: string, modelId: string, label: string|null, name: string, colorSlot: number, profile: Object }>}
   */
  function getModels() {
    const models = state.modelOrder.map((key) => {
      const run = state.runs.find((candidate) => candidate.modelKey === key);
      return { key, modelId: run.modelId, label: run.label };
    });
    const defaults = modelNaming.defaultShortNames(models);
    return models.map((model, index) => {
      const profile = state.profiles[model.key] || benchmarkRun.createModelProfile();
      return {
        ...model,
        name: profile.shortName || defaults[model.key],
        colorSlot: index < SERIES_SLOTS ? index + 1 : 0,
        profile,
      };
    });
  }

  return { init, subscribe, getState, getStorageError, importResults, removeRun, removeModel, clearAll, updateProfile, getModels };
});
