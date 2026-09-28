/* The line-up: which models were tested, their memory footprint, and how complete each one's results are. */
BenchPanel.define('features/overview/ModelOverviewTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'utils/runCollection', 'utils/numberFormat', 'utils/hardwareSummary',
], (dom, dataTable, modelTag, runCollection, numberFormat, hardwareSummary) => {
  'use strict';

  function gigabytes(value, decimals) {
    return value === null ? numberFormat.MISSING : `${numberFormat.formatNumber(value, decimals)} GB`;
  }

  function memoryUsed(summary) {
    if (summary.memoryUsedGb === null) return numberFormat.MISSING;
    const used = gigabytes(summary.memoryUsedGb, 2);
    return summary.occupancy === null ? used : `${used} (${numberFormat.formatNumber(summary.occupancy * 100, 0)}%)`;
  }

  /** @param {{ models: Object[], runs: Object[] }} props */
  function ModelOverviewTable(props) {
    const rows = props.models.map((model) => {
      const runs = runCollection.runsForModel(props.runs, model.key);
      return {
        model,
        gpu: hardwareSummary.summarizeGpus(model.profile),
        levels: runs.map((run) => numberFormat.formatConcurrency(run.concurrency)).join(', '),
        requests: runs.reduce((sum, run) => sum + run.numPrompts, 0),
        failed: runs.reduce((sum, run) => sum + run.failed, 0),
      };
    });
    const columns = [
      { label: 'Short name', render: (row) => modelTag.ModelTag(row.model) },
      { label: 'Full model', render: (row) => row.model.modelId + (row.model.label ? ` [${row.model.label}]` : '') },
      { label: 'Weights', title: 'Model weights in GPU memory', align: 'right', render: (row) => gigabytes(row.model.profile.modelSizeGb, 2) },
      { label: 'GPUs', align: 'right', render: (row) => String(row.gpu.gpuCount) },
      { label: 'Memory used', title: 'GPU memory used during the benchmark, all GPUs; share of GPU capacity in brackets', align: 'right',
        render: (row) => memoryUsed(row.gpu) },
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
