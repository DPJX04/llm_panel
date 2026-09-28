/* How each run was set up: request count, failures, token lengths, duration, and source file. */
BenchPanel.define('features/modelDetail/RunDetailsTable', [
  'components/dom', 'components/DataTable/DataTable', 'utils/numberFormat',
], (dom, dataTable, numberFormat) => {
  'use strict';

  function perRequest(total, count) {
    return typeof total === 'number' && count > 0 ? numberFormat.formatNumber(total / count, 0) : numberFormat.MISSING;
  }

  /** @param {{ runs: Object[] }} props */
  function RunDetailsTable(props) {
    const columns = [
      { label: 'Concurrency', align: 'right', render: (run) => numberFormat.formatConcurrency(run.concurrency) },
      { label: 'Prompts', align: 'right', render: (run) => numberFormat.formatNumber(run.numPrompts, 0) },
      { label: 'Completed', align: 'right', render: (run) => numberFormat.formatNumber(run.completed, 0) },
      { label: 'Failed', align: 'right', render: (run) => (run.failed > 0
        ? dom.h('span', { className: 'status-flag status-flag--warning', text: `! ${run.failed}` })
        : '0') },
      { label: 'Avg input tokens', align: 'right', render: (run) => perRequest(run.totalInputTokens, run.completed) },
      { label: 'Avg output tokens', align: 'right', render: (run) => perRequest(run.totalOutputTokens, run.completed) },
      { label: 'Peak output tok/s', align: 'right', render: (run) => numberFormat.formatNumber(run.peakOutputTokensPerS, 0) },
      { label: 'Duration', align: 'right', render: (run) => numberFormat.formatDuration(run.durationS) },
      { label: 'Run date', render: (run) => numberFormat.formatRunDate(run.date) },
      { label: 'File', render: (run) => dom.h('span', { className: 'muted', text: run.sourceFile }) },
    ];
    return dataTable.DataTable({ columns, rows: props.runs, caption: 'Run details' });
  }

  return { RunDetailsTable };
});
