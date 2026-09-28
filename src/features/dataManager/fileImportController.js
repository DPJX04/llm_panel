/* Reads picked or dropped files into the workspace and describes what happened in plain words. */
BenchPanel.define('features/dataManager/fileImportController', [
  'services/resultFileService', 'store/workspaceStore',
], (resultFileService, workspaceStore) => {
  'use strict';

  function plural(count, word) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
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

    const { runs, workspaces, warnings } = read.data;
    const summary = workspaceStore.importResults(runs, workspaces);
    const details = [];
    if (summary.added) details.push(`${plural(summary.added, 'new run')}`);
    if (summary.replaced) details.push(`${plural(summary.replaced, 'run')} updated with a newer result`);
    if (summary.skipped) details.push(`${plural(summary.skipped, 'older run')} ignored (a newer one is already loaded)`);
    const source = workspaces.length > 0 ? `${plural(workspaces.length, 'workspace')} and ${plural(files.length - workspaces.length, 'file')}` : plural(files.length, 'file');
    return {
      tone: warnings.length > 0 ? 'warning' : 'success',
      title: `Loaded ${source}: ${details.join(', ') || 'no changes'}.`,
      lines: warnings,
    };
  }

  return { importFiles };
});
