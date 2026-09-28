/* One metric as a grid: a row per model, a column per concurrency level, best model in each column bolded. */
BenchPanel.define('features/comparison/MetricMatrixTable', [
  'components/DataTable/DataTable', 'components/DataTable/metricColumn', 'components/ModelTag/ModelTag',
  'utils/runCollection', 'utils/numberFormat',
], (dataTable, metricColumn, modelTag, runCollection, numberFormat) => {
  'use strict';

  /** @param {{ models: Object[], runs: Object[], metricKey: string, markWorst?: boolean }} props */
  function MetricMatrixTable(props) {
    const levels = runCollection.concurrencyLevels(props.runs);
    const rows = props.models.map((model) => ({ model, baseline: runCollection.baselineRun(props.runs, model.key) }));
    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      ...levels.map((level) => metricColumn.metricColumn(props.metricKey, {
        label: `C${numberFormat.formatConcurrency(level)}`,
        run: (row) => runCollection.findRun(props.runs, row.model.key, level),
        baseline: (row) => row.baseline,
        markWorst: props.markWorst,
      })),
    ];
    return dataTable.DataTable({ columns, rows, caption: `${props.metricKey} by model and concurrency` });
  }

  return { MetricMatrixTable };
});
