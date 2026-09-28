/* One model's headline numbers at every concurrency level it was tested at. */
BenchPanel.define('features/modelDetail/SummaryTable', [
  'components/DataTable/DataTable', 'components/DataTable/metricColumn', 'utils/numberFormat',
], (dataTable, metricColumn, numberFormat) => {
  'use strict';

  const METRIC_KEYS = ['requestThroughput', 'outputThroughput', 'totalTokenThroughput', 'meanTtftMs', 'meanTpotMs', 'meanE2eMs', 'successRate'];

  /** @param {{ runs: Object[] }} props  one model's runs, ascending concurrency */
  function SummaryTable(props) {
    const columns = [
      { label: 'Concurrency', align: 'right', render: (run) => numberFormat.formatConcurrency(run.concurrency) },
      ...METRIC_KEYS.map((key) => metricColumn.metricColumn(key, { run: (run) => run, highlight: false })),
    ];
    return dataTable.DataTable({ columns, rows: props.runs, caption: 'Summary by concurrency' });
  }

  return { SummaryTable };
});
