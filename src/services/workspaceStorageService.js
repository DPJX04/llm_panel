/*
 * Saves the workspace in the browser so loaded results survive a page refresh,
 * and builds the portable workspace file used for export.
 */
BenchPanel.define('services/workspaceStorageService', [
  'types/result', 'config/appConfig', 'utils/errorMessage', 'services/resultParser',
], (result, appConfig, errorMessage, resultParser) => {
  'use strict';

  /** The saved shape. Runs and evaluation reports are stored as their original records, so loading re-runs the same validation. */
  function toWorkspaceFile(state) {
    return {
      kind: appConfig.workspaceFileKind,
      version: appConfig.workspaceFileVersion,
      savedAt: new Date().toISOString(),
      records: state.runs.map((run) => ({ sourceFile: run.sourceFile, data: run.raw })),
      profiles: state.profiles,
      modelOrder: state.modelOrder,
      evalReports: (state.evalReports || []).map((report) => ({ sourceFile: report.sourceFile, data: report.raw })),
    };
  }

  /** @returns {import('../types/result').Result<true>} */
  function save(state) {
    try {
      window.localStorage.setItem(appConfig.storageKey, JSON.stringify(toWorkspaceFile(state)));
      return result.ok(true);
    } catch (cause) {
      return result.fail(`Could not save in this browser: ${errorMessage.toErrorMessage(cause)}`);
    }
  }

  /** @returns {import('../types/result').Result<Object|null>}  null when nothing was saved before */
  function load() {
    try {
      const text = window.localStorage.getItem(appConfig.storageKey);
      if (!text) return result.ok(null);
      const workspace = resultParser.parseWorkspace(JSON.parse(text));
      return workspace.ok ? result.ok(workspace.data) : result.fail(workspace.error);
    } catch (cause) {
      return result.fail(`Saved workspace could not be read: ${errorMessage.toErrorMessage(cause)}`);
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(appConfig.storageKey);
    } catch (cause) {
      // Storage may be blocked (private window); there is nothing to clear then.
    }
  }

  return { toWorkspaceFile, save, load, clear };
});
