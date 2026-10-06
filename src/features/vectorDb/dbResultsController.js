/*
 * The Vector DB tab's own list of loaded runs, kept apart from the LLM results and saved in this browser.
 * Each change describes what happened in plain words for the tab to show.
 */
BenchPanel.define('features/vectorDb/dbResultsController', [
  'services/dbResultFileService', 'services/dbResultStorageService', 'utils/dbResultCollection',
], (dbResultFileService, dbResultStorageService, dbResultCollection) => {
  'use strict';

  function plural(count, word) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
  }

  /** Starts with the runs saved by an earlier visit. */
  function createDbResultsController() {
    let results = [];
    let storageError = null;

    const loaded = dbResultStorageService.load();
    if (loaded.ok) results = loaded.data;
    else storageError = loaded.error;

    /** Writes the list to browser storage and remembers whether that worked. */
    function save() {
      const saved = dbResultStorageService.save(results);
      storageError = saved.ok ? null : saved.error;
    }

    /**
     * Reads picked files into the list. A run that is already loaded is kept once, so it is not averaged twice.
     * @param {File[]} files
     * @returns {Promise<{ tone: 'success'|'warning'|'error', title: string, lines: string[] }>}
     */
    async function loadFiles(files) {
      const read = await dbResultFileService.readDbResultFiles(files);
      if (!read.ok) return { tone: 'error', title: 'Nothing was loaded', lines: read.error.split('\n') };

      const merged = dbResultCollection.mergeDbResults(results, read.data.results);
      results = merged.results;
      save();
      const details = [];
      if (merged.added) details.push(plural(merged.added, 'new run'));
      if (merged.duplicates) details.push(`${plural(merged.duplicates, 'run')} already loaded (counted once)`);
      return {
        tone: read.data.warnings.length > 0 ? 'warning' : 'success',
        title: `Loaded ${plural(files.length, 'file')}: ${details.join(', ')}.`,
        lines: read.data.warnings,
      };
    }

    /** Removes one run. */
    function remove(id) {
      results = results.filter((entry) => entry.id !== id);
      save();
    }

    /** Removes every run, here and in browser storage. */
    function clear() {
      results = [];
      storageError = null;
      dbResultStorageService.clear();
    }

    return {
      getResults: () => results,
      getStorageError: () => storageError,
      loadFiles,
      remove,
      clear,
    };
  }

  return { createDbResultsController };
});
