/* One model's headline numbers at every concurrency level it was tested at. */
BenchPanel.define('features/modelDetail/SummaryTable', [
  'components/DataTable/DataTable', 'components/DataTable/metricColumn', 'utils/numberFormat',
], (dataTable, metricColumn, numberFormat) => {
  'use strict';

  /** The metric columns, Per user tok/s right after Decode tok/s, in the formula the user picked. */
  function metricKeys(perUserKey) {
    return ['requestThroughput', 'outputThroughput', 'totalTokenThroughput', 'decodeTokensPerSecond', perUserKey,
      'meanTtftMs', 'meanTpotMs', 'meanE2eMs', 'successRate'];
  }

  /** @param {{ runs: Object[], perUserKey: string }} props  one model's runs, ascending concurrency */
  function SummaryTable(props) {
    const columns = [
      { label: 'Concurrency', align: 'right', render: (run) => numberFormat.formatConcurrency(run.concurrency) },
      ...metricKeys(props.perUserKey).map((key) => metricColumn.metricColumn(key, { run: (run) => run, highlight: false })),
    ];
    return dataTable.DataTable({ columns, rows: props.runs, caption: 'Summary by concurrency' });
  }

  return { SummaryTable };
});
