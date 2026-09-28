/*
 * Reads picked or dropped files into the workspace and describes what happened in plain words.
 * A vLLM server log fills the memory and KV cache details of the loaded model it names.
 */
BenchPanel.define('features/dataManager/fileImportController', [
  'services/resultFileService', 'store/workspaceStore', 'features/dataManager/profileController',
], (resultFileService, workspaceStore, profileController) => {
  'use strict';

  function plural(count, word) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
  }

  /** Applies each log to the loaded model it names. @returns {{ applied: string[], warnings: string[] }} */
  function applyLogs(logs) {
    const applied = [];
    const warnings = [];
    logs.forEach(({ fileName, stats }) => {
      // Re-read the models each time, so two logs for one model build on each other.
      const model = workspaceStore.getModels().find((candidate) => candidate.modelId === stats.modelId);
      if (!model) {
        warnings.push(`${fileName}: this log is for "${stats.modelId || 'an unnamed model'}", which has no loaded results. `
          + 'Load its results first, or use "Fill from vLLM log" under Hardware and memory.');
        return;
      }
      profileController.applyLogStats(model, stats);
      applied.push(model.name);
    });
    return { applied, warnings };
  }

  /**
   * @param {FileList|File[]} fileList
   * @param {{ fromFolder?: boolean }} [options]
   * @returns {Promise<{ tone: 'success'|'warning'|'error', title: string, lines: string[] }|null>}
   */
  async function importFiles(fileList, options) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return null;

    const read = await resultFileService.readResultFiles(files, options);
    if (!read.ok) return { tone: 'error', title: 'Nothing was loaded', lines: read.error.split('\n') };

    const { runs, workspaces, logs, warnings } = read.data;
    const summary = workspaceStore.importResults(runs, workspaces);
    const logResult = applyLogs(logs);

    const details = [];
    if (summary.added) details.push(plural(summary.added, 'new run'));
    if (summary.replaced) details.push(`${plural(summary.replaced, 'run')} updated with a newer result`);
    if (summary.skipped) details.push(`${plural(summary.skipped, 'older run')} ignored (a newer one is already loaded)`);
    if (logResult.applied.length) details.push(`memory and KV cache filled for ${logResult.applied.join(', ')}`);
    const allWarnings = warnings.concat(logResult.warnings);
    return {
      tone: allWarnings.length > 0 ? 'warning' : 'success',
      title: `Loaded ${plural(files.length, 'file')}: ${details.join(', ') || 'no changes'}.`,
      lines: allWarnings,
    };
  }

  return { importFiles };
});
