/* Decode speed (1000 ÷ TPOT) at each level, next to total throughput and how well it scaled. */
BenchPanel.define('features/modelDetail/TokenSpeedTable', [
  'components/DataTable/DataTable', 'components/DataTable/metricColumn', 'utils/numberFormat',
], (dataTable, metricColumn, numberFormat) => {
  'use strict';

  /** @param {{ runs: Object[] }} props  one model's runs, ascending concurrency */
  function TokenSpeedTable(props) {
    const baseline = props.runs[0];
    const access = { run: (run) => run, baseline: () => baseline, highlight: false };
    const columns = [
      { label: 'Concurrency', align: 'right', render: (run) => numberFormat.formatConcurrency(run.concurrency) },
      metricColumn.metricColumn('meanTpotMs', { ...access, label: 'TPOT' }),
      metricColumn.metricColumn('decodeTokensPerSecond', access),
      metricColumn.metricColumn('outputThroughput', { ...access, label: 'Output TPS (all requests)' }),
      metricColumn.metricColumn('scalingEfficiency', access),
    ];
    return dataTable.DataTable({ columns, rows: props.runs, caption: 'Token generation speed' });
  }

  return { TokenSpeedTable };
});
