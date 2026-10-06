/*
 * Saves the loaded vector database runs in this browser, under their own key apart from the LLM workspace,
 * so they survive a page refresh.
 */
BenchPanel.define('services/dbResultStorageService', [
  'types/result', 'config/appConfig', 'utils/errorMessage', 'services/dbResultParser',
], (result, appConfig, errorMessage, dbResultParser) => {
  'use strict';

  /** Saves each run as its cleaned original entry, so loading it back re-runs the same validation. @returns {import('../types/result').Result<true>} */
  function save(results) {
    try {
      const records = results.map((entry) => ({ sourceFile: entry.sourceFile, data: entry.raw }));
      window.localStorage.setItem(appConfig.dbResultsStorageKey, JSON.stringify({ records }));
      return result.ok(true);
    } catch (cause) {
      return result.fail(`Could not save in this browser: ${errorMessage.toErrorMessage(cause)}`);
    }
  }

  /** Reads back the saved runs; an empty list when nothing was saved before. @returns {import('../types/result').Result<Object[]>} */
  function load() {
    try {
      const text = window.localStorage.getItem(appConfig.dbResultsStorageKey);
      const saved = text ? JSON.parse(text) : null;
      const records = saved && Array.isArray(saved.records) ? saved.records : [];
      return result.ok(records.flatMap((record) => {
        const sourceFile = record && typeof record.sourceFile === 'string' ? record.sourceFile : 'saved';
        const parsed = dbResultParser.toDbResults(record ? record.data : null, sourceFile);
        return parsed.ok ? parsed.data.results : [];
      }));
    } catch (cause) {
      return result.fail(`Saved database results could not be read: ${errorMessage.toErrorMessage(cause)}`);
    }
  }

  /** Removes the saved runs. */
  function clear() {
    try {
      window.localStorage.removeItem(appConfig.dbResultsStorageKey);
    } catch (cause) {
      // Storage may be blocked (private window); there is nothing to clear then.
    }
  }

  return { save, load, clear };
});
