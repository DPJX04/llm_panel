/* Per-request generation speed (1000 ÷ TPOT) at each level, and how much of it survives as load grows. */
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
      metricColumn.metricColumn('tokensPerRequest', { ...access, label: 'Approx tok/s per request' }),
      metricColumn.metricColumn('speedRetention', { ...access, label: `Speed kept vs C${numberFormat.formatConcurrency(baseline.concurrency)}` }),
      metricColumn.metricColumn('outputThroughput', { ...access, label: 'Output TPS (all requests)' }),
      metricColumn.metricColumn('scalingEfficiency', access),
    ];
    return dataTable.DataTable({ columns, rows: props.runs, caption: 'Token generation speed' });
  }

  return { TokenSpeedTable };
});
