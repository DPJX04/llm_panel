/*
 * The Vector DB tab: load VectorDBBench results with its own button, then see each dataset's headline numbers and
 * QPS and recall charts, and one card per dataset and ef search value with its table, concurrency charts and config.
 * Runs with the same config are averaged.
 */
BenchPanel.define('features/vectorDb/VectorDbView', [
  'components/dom', 'components/Section/Section', 'components/Callout/Callout', 'components/StatTile/StatTile',
  'components/DropZone/DropZone', 'components/renderKeepingFocus', 'utils/dbResultSummary', 'utils/dbResultCharts',
  'services/preferencesService', 'features/vectorDb/dbResultsController', 'features/vectorDb/headlineTiles',
  'features/vectorDb/ComparisonCharts', 'features/vectorDb/ConcurrencyCharts', 'features/vectorDb/QpsRecallTable',
  'features/vectorDb/ConfigTable', 'features/vectorDb/LoadedDbRunsTable',
], (dom, section, callout, statTile, dropZone, focus, dbResultSummary, dbResultCharts, preferencesService, dbResultsController,
  headlineTiles, comparisonCharts, concurrencyCharts, qpsRecallTable, configTable, loadedDbRunsTable) => {
  'use strict';

  const CONFIRM_WINDOW_MS = 4000;
  const RECALL_MARK_PREFERENCE = 'vectorDb.recallMark';
  const DEFAULT_RECALL_MARK = 'bar';

  function Notice(notice) {
    return dom.h('div', { className: 'vector-db-notice' }, callout.Callout(notice));
  }

  /** One dataset at one ef search value: the averaged QPS and recall, how they change with concurrency, then each row's config. */
  function CaseEfCard(group) {
    const hasCurves = group.rows.some((row) => row.concurrencyPoints.length >= 2);
    return section.Section({
      title: `${group.caseName} · ${group.efSearch === null ? 'ef search not set' : `ef search ${group.efSearch}`}`,
      description: 'Runs with the same database and index config are averaged into one row. Hover a column header for its meaning.',
    },
    section.SubSection({ title: 'QPS and recall' }, qpsRecallTable.QpsRecallTable({ rows: group.rows })),
    hasCurves ? section.SubSection({
      title: 'Across concurrency',
      description: 'More queries at once raise QPS until the database is saturated (left), and each query waits longer (right).',
    }, concurrencyCharts.ConcurrencyCharts({ rows: group.rows })) : null,
    section.SubSection({ title: 'Config', description: 'Row numbers match the table above.' }, configTable.ConfigTable({ rows: group.rows })));
  }

  /** One dataset's headline numbers and charts. Datasets differ in size, so their numbers are never compared with each other. */
  /**
   * @param {Object} entry  one dataset from dbResultSummary.groupByCase
   * @param {{ recallMark: string, onRecallMark: (mark: string) => void }} recallChoice  bars or dots for the recall chart
   */
  function DatasetSection(entry, recallChoice) {
    return section.Section({
      title: entry.caseName,
      description: 'Left: each line is one database and each point one ef search value; up and to the right is better. '
        + 'Right: the same runs at each ef search. Hover any chart for exact values.',
    },
    dom.h('div', { className: 'stat-tiles vector-db-tiles' }, headlineTiles.buildHeadlineTiles(entry.rows).map(statTile.StatTile)),
    comparisonCharts.ComparisonCharts({ rows: entry.rows, caseName: entry.caseName, ...recallChoice }));
  }

  /** Everything below the load button: one section per dataset with its tiles and charts, then one card per dataset and ef search. */
  function Results(results, recallChoice) {
    const rows = dbResultCharts.withLines(dbResultSummary.averageByConfig(results));
    return [
      dbResultSummary.groupByCase(rows).map((entry) => DatasetSection(entry, recallChoice)),
      dbResultSummary.groupByCaseAndEf(rows).map(CaseEfCard),
    ];
  }

  /** The saved way to draw recall (bars or dots), or the default when none was saved or the saved one is unknown. */
  function savedRecallMark() {
    const saved = preferencesService.load(RECALL_MARK_PREFERENCE, DEFAULT_RECALL_MARK);
    return comparisonCharts.RECALL_MARKS.some((mark) => mark.value === saved) ? saved : DEFAULT_RECALL_MARK;
  }

  function mountVectorDb(container) {
    const controller = dbResultsController.createDbResultsController();
    let notice = null;
    let confirmingClear = false;
    let recallMark = savedRecallMark();

    // Switching bars and dots changes every dataset's recall chart, and is remembered for the next visit.
    function handleRecallMark(mark) {
      recallMark = mark;
      preferencesService.save(RECALL_MARK_PREFERENCE, mark);
      render();
    }

    async function handleFiles(files) {
      if (files.length === 0) return;
      notice = { tone: 'info', title: `Reading ${files.length} file${files.length === 1 ? '' : 's'}…`, lines: [] };
      render();
      notice = await controller.loadFiles(files);
      render();
    }

    function handleRemove(entry) {
      controller.remove(entry.id);
      render();
    }

    // The first click asks for a second one within a few seconds, so one stray click cannot wipe the list.
    function handleClear() {
      if (!confirmingClear) {
        confirmingClear = true;
        render();
        setTimeout(() => { confirmingClear = false; render(); }, CONFIRM_WINDOW_MS);
        return;
      }
      confirmingClear = false;
      notice = null;
      controller.clear();
      render();
    }

    function build() {
      const results = controller.getResults();
      const storageError = controller.getStorageError();
      return dom.h('div', { className: 'view-stack' },
        section.Section({
          title: 'Load database results',
          description: 'Kept apart from the LLM results on the Data tab, and saved in this browser. Loading the same file twice counts it once.',
        },
        dropZone.DropZone({
          title: 'Drop database result files here',
          hint: 'VectorDBBench result JSON files (result_*.json), or a CSV with one run per row. Load several runs of the same config to get their average.',
          accept: '.json,.csv,application/json,text/csv',
          onFiles: handleFiles,
        }),
        notice ? Notice(notice) : null,
        storageError ? Notice({ tone: 'warning', title: storageError, lines: ['Database results will be lost on refresh.'] }) : null),

        results.length === 0
          ? dom.h('p', { className: 'hint', text: 'No database results yet. Drop VectorDBBench result files above; each dataset and ef search value gets its own table.' })
          : Results(results, { recallMark, onRecallMark: handleRecallMark }),

        results.length > 0 ? section.Section({
          title: `Loaded runs (${results.length})`,
          description: 'Each run on its own, before averaging.',
          actions: [dom.h('button', {
            type: 'button',
            className: `button ${confirmingClear ? 'button--danger' : 'button--quiet'}`,
            text: confirmingClear ? 'Click again to remove every database run' : 'Clear all',
            on: { click: handleClear },
          })],
        }, loadedDbRunsTable.LoadedDbRunsTable({ results, onRemove: handleRemove })) : null);
    }

    function render() {
      focus.renderKeepingFocus(container, build);
    }

    render();
  }

  return { mountVectorDb };
});
