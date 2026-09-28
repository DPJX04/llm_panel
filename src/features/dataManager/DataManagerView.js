/* The Data tab: load results, name models, add hardware and memory details, export, and manage loaded runs. */
BenchPanel.define('features/dataManager/DataManagerView', [
  'components/dom', 'components/Section/Section', 'components/Callout/Callout', 'store/workspaceStore',
  'features/dataManager/FileDropZone', 'features/dataManager/ModelProfilesTable', 'features/dataManager/HardwareEditor',
  'features/dataManager/LoadedRunsTable', 'features/dataManager/fileImportController',
  'features/dataManager/profileController', 'features/dataManager/exportActions',
], (dom, section, callout, workspaceStore, fileDropZone, modelProfilesTable, hardwareEditor, loadedRunsTable,
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

  function Notice(notice) {
    return dom.h('div', { className: 'data-notice' }, callout.Callout(notice));
  }

  function mountDataManager(container) {
    let notice = null;
    let hardwareNotice = null;
    let confirmingClear = false;
    let selectedKey = null;
    const paste = { open: false, text: '' };

    async function handleFiles(files, options) {
      notice = { tone: 'info', title: `Reading ${files.length} file${files.length === 1 ? '' : 's'}…`, lines: [] };
      render();
      notice = await fileImportController.importFiles(files, options);
      render();
    }

    async function handleLogFile(model, file) {
      hardwareNotice = await profileController.fillFromLogFile(model, file);
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

    const pasteHandlers = {
      onToggle: () => { paste.open = !paste.open; render(); },
      onText: (text) => { paste.text = text; },
      onApply: (text) => {
        const model = workspaceStore.getModels().find((candidate) => candidate.key === selectedKey);
        hardwareNotice = profileController.applyGpuTable(model, text);
        if (hardwareNotice.tone === 'success') { paste.open = false; paste.text = ''; }
        render();
      },
    };

    function build() {
      const state = workspaceStore.getState();
      const models = workspaceStore.getModels();
      const runCounts = {};
      state.runs.forEach((run) => { runCounts[run.modelKey] = (runCounts[run.modelKey] || 0) + 1; });
      const storageError = workspaceStore.getStorageError();
      const selected = models.find((model) => model.key === selectedKey) || models[0];
      selectedKey = selected ? selected.key : null;

      return dom.h('div', { className: 'view-stack' },
        section.Section({
          title: 'Load benchmark results',
          description: 'Drop vLLM result files (one run per file, or many runs in one file) and, optionally, each model\'s `vllm serve` log to fill its memory and KV cache details. A newer run for the same model and level replaces the older one. Everything stays in this browser.',
        },
        fileDropZone.FileDropZone({ onFiles: handleFiles }),
        notice ? Notice(notice) : null,
        storageError ? Notice({ tone: 'warning', title: storageError, lines: ['Results will be lost on refresh. Use Export workspace to keep them.'] }) : null),

        selected ? section.Section({
          title: 'Models',
          description: 'Short names are used everywhere in the panel.',
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

        selected ? hardwareEditor.HardwareEditor({
          models,
          model: selected,
          onSelect: (key) => { selectedKey = key; hardwareNotice = null; render(); },
          onEdit: profileController.updateProfileField,
          onAddGpu: profileController.addGpu,
          onRemoveGpu: profileController.removeGpu,
          onLogFile: handleLogFile,
          paste: { ...paste, ...pasteHandlers },
          notice: hardwareNotice,
        }) : null,

        selected ? section.Section({
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
