/* Every loaded run, grouped by model, with the file it came from and a way to remove it. */
BenchPanel.define('features/dataManager/LoadedRunsTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'utils/runCollection', 'utils/numberFormat',
], (dom, dataTable, modelTag, runCollection, numberFormat) => {
  'use strict';

  /** @param {{ runs: Object[], models: Object[], onRemove: (run: Object) => void }} props */
  function LoadedRunsTable(props) {
    const rows = props.models.flatMap((model) =>
      runCollection.runsForModel(props.runs, model.key).map((run) => ({ run, model })));

    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      { label: 'Concurrency', align: 'right', render: (row) => numberFormat.formatConcurrency(row.run.concurrency) },
      { label: 'Prompts', align: 'right', render: (row) => numberFormat.formatNumber(row.run.numPrompts, 0) },
      { label: 'Failed', align: 'right', render: (row) => (row.run.failed > 0
        ? dom.h('span', { className: 'status-flag status-flag--warning', text: `! ${row.run.failed}` })
        : '0') },
      { label: 'Output TPS', align: 'right', render: (row) => numberFormat.formatNumber(row.run.outputThroughput, 1) },
      { label: 'Run date', render: (row) => numberFormat.formatRunDate(row.run.date) },
      { label: 'File', render: (row) => dom.h('span', { className: 'muted', text: row.run.sourceFile }) },
      { label: '', render: (row) => dom.h('button', { type: 'button', className: 'button button--quiet', text: 'Remove',
        'aria-label': `Remove ${row.model.name} at concurrency ${numberFormat.formatConcurrency(row.run.concurrency)}`,
        on: { click: () => props.onRemove(row.run) } }) },
    ];
    return dataTable.DataTable({ columns, rows, caption: 'Loaded runs' });
  }

  return { LoadedRunsTable };
});
