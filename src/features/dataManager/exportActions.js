/* Saves the workspace or a CSV of every run to a file the user can share. */
BenchPanel.define('features/dataManager/exportActions', [
  'services/fileDownloadService', 'services/workspaceStorageService', 'store/workspaceStore', 'features/dataManager/runsCsv',
], (fileDownloadService, workspaceStorageService, workspaceStore, runsCsv) => {
  'use strict';

  function stamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function exportWorkspace() {
    return fileDownloadService.downloadJson(
      `benchmark-workspace-${stamp()}.json`,
      workspaceStorageService.toWorkspaceFile(workspaceStore.getState()));
  }

  function exportCsv() {
    const csv = runsCsv.buildRunsCsv(workspaceStore.getState().runs, workspaceStore.getModels());
    return fileDownloadService.downloadCsv(`benchmark-results-${stamp()}.csv`, csv);
  }

  return { exportWorkspace, exportCsv };
});
