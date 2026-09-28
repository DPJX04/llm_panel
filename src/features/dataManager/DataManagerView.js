/* The Data tab: load results, name models, add hardware numbers, export, and manage loaded runs. */
BenchPanel.define('features/dataManager/DataManagerView', [
  'components/dom', 'components/Section/Section', 'store/workspaceStore',
  'features/dataManager/FileDropZone', 'features/dataManager/ImportNotice', 'features/dataManager/ModelProfilesTable',
  'features/dataManager/LoadedRunsTable', 'features/dataManager/fileImportController',
  'features/dataManager/profileController', 'features/dataManager/exportActions',
], (dom, section, workspaceStore, fileDropZone, importNotice, modelProfilesTable, loadedRunsTable,
  fileImportController, profileController, exportActions) => {
  'use strict';

  const CONFIRM_WINDOW_MS = 4000;

  /** Re-rendering replaces inputs; put focus back on the same field so Tab-through editing keeps working. */
  function renderKeepingFocus(container, build) {
    const active = document.activeElement;
    const focusKey = active && container.contains(active) ? active.getAttribute('data-focus-key') : null;
    dom.clear(container);
    container.appendChild(build());
    if (focusKey) {
      const target = Array.from(container.querySelectorAll('[data-focus-key]')).find((node) => node.getAttribute('data-focus-key') === focusKey);
      if (target) target.focus();
    }
  }

  function mountDataManager(container) {
    let notice = null;
    let confirmingClear = false;

    async function handleFiles(files, options) {
      notice = { tone: 'success', title: `Reading ${files.length} file${files.length === 1 ? '' : 's'}…`, lines: [] };
      render();
      notice = await fileImportController.importFiles(files, options);
      render();
    }

    function handleExport(action) {
      const outcome = action();
      if (!outcome.ok) { notice = { tone: 'error', title: outcome.error, lines: [] }; render(); }
    }

    function handleClear() {
      if (!confirmingClear) {
        confirmingClear = true;
        render();
        setTimeout(() => { confirmingClear = false; render(); }, CONFIRM_WINDOW_MS);
        return;
      }
      confirmingClear = false;
      notice = null;
      workspaceStore.clearAll();
    }

    function build() {
      const state = workspaceStore.getState();
      const models = workspaceStore.getModels();
      const runCounts = {};
      state.runs.forEach((run) => { runCounts[run.modelKey] = (runCounts[run.modelKey] || 0) + 1; });
      const storageError = workspaceStore.getStorageError();
      const hasRuns = state.runs.length > 0;

      return dom.h('div', { className: 'view-stack' },
        section.Section({
          title: 'Load benchmark results',
          description: 'Each vLLM result file holds one model at one concurrency level. Load every file for every model; a newer run for the same model and level replaces the older one. Everything stays in this browser.',
        },
        fileDropZone.FileDropZone({ onFiles: handleFiles }),
        notice ? importNotice.ImportNotice(notice) : null,
        storageError ? importNotice.ImportNotice({ tone: 'warning', title: storageError, lines: ['Results will be lost on refresh. Use Export workspace to keep them.'] }) : null),

        hasRuns ? section.Section({
          title: 'Models',
          description: 'Short names are used everywhere in the panel. Result files do not record hardware, so add model size, VRAM, GPU utilisation and power (from nvidia-smi during the run) to unlock the GPU efficiency comparison.',
          actions: [
            dom.h('button', { type: 'button', className: 'button', text: 'Export workspace', title: 'Save runs and model details as one file you can share or load later', on: { click: () => handleExport(exportActions.exportWorkspace) } }),
            dom.h('button', { type: 'button', className: 'button', text: 'Export CSV', title: 'Every run with all metrics, for Excel', on: { click: () => handleExport(exportActions.exportCsv) } }),
          ],
        }, modelProfilesTable.ModelProfilesTable({
          models,
          runCounts,
          onEdit: profileController.updateProfileField,
          onRemove: (model) => workspaceStore.removeModel(model.key),
        })) : null,

        hasRuns ? section.Section({
          title: `Loaded runs (${state.runs.length})`,
          actions: [dom.h('button', {
            type: 'button',
            className: `button ${confirmingClear ? 'button--danger' : 'button--quiet'}`,
            text: confirmingClear ? 'Click again to remove everything' : 'Clear all',
            on: { click: handleClear },
          })],
        }, loadedRunsTable.LoadedRunsTable({ runs: state.runs, models, onRemove: (run) => workspaceStore.removeRun(run.id) })) : null);
    }

    function render() {
      renderKeepingFocus(container, build);
    }

    render();
    return workspaceStore.subscribe(render);
  }

  return { mountDataManager };
});
