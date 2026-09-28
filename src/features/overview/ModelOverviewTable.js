/* The line-up: which models were tested, their size and memory, and how complete each one's results are. */
BenchPanel.define('features/overview/ModelOverviewTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'utils/runCollection', 'utils/numberFormat',
], (dom, dataTable, modelTag, runCollection, numberFormat) => {
  'use strict';

  function gigabytes(value, decimals) {
    return value === null ? numberFormat.MISSING : `${numberFormat.formatNumber(value, decimals)} GB`;
  }

  /** @param {{ models: Object[], runs: Object[] }} props */
  function ModelOverviewTable(props) {
    const rows = props.models.map((model) => {
      const runs = runCollection.runsForModel(props.runs, model.key);
      return {
        model,
        levels: runs.map((run) => numberFormat.formatConcurrency(run.concurrency)).join(', '),
        requests: runs.reduce((sum, run) => sum + run.numPrompts, 0),
        failed: runs.reduce((sum, run) => sum + run.failed, 0),
      };
    });
    const columns = [
      { label: 'Short name', render: (row) => modelTag.ModelTag(row.model) },
      { label: 'Full model', render: (row) => row.model.modelId + (row.model.label ? ` [${row.model.label}]` : '') },
      { label: 'Model size', align: 'right', render: (row) => gigabytes(row.model.profile.modelSizeGb, 1) },
      { label: 'VRAM used', align: 'right', render: (row) => gigabytes(row.model.profile.vramGb, 2) },
      { label: 'Concurrency tested', render: (row) => row.levels },
      { label: 'Requests', align: 'right', render: (row) => numberFormat.formatNumber(row.requests, 0) },
      { label: 'Failed', align: 'right', render: (row) => (row.failed > 0
        ? dom.h('span', { className: 'status-flag status-flag--warning', text: `! ${row.failed}` })
        : dom.h('span', { className: 'status-flag status-flag--good', text: '✓ 0' })) },
    ];
    return dataTable.DataTable({ columns, rows, caption: 'Model overview' });
  }

  return { ModelOverviewTable };
});
