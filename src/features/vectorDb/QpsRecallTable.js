/* QPS and recall for one dataset at one ef search value: one row per database config, each the average of its runs. Best values in bold. */
BenchPanel.define('features/vectorDb/QpsRecallTable', [
  'components/DataTable/DataTable', 'components/ModelTag/ModelTag', 'utils/numberFormat',
], (dataTable, modelTag, numberFormat) => {
  'use strict';

  /** @param {{ rows: Object[] }} props  the rows of one group, each with its row number, line name and colour */
  function QpsRecallTable(props) {
    const columns = [
      { label: '#', align: 'right', render: (row) => String(row.number) },
      { label: 'Database', render: (row) => modelTag.ModelTag(row) },
      { label: 'Runs', align: 'right', title: 'How many result files were averaged into this row', render: (row) => String(row.runs) },
      { label: 'QPS', align: 'right', title: 'Queries per second at the best concurrency level, averaged over the runs',
        value: (row) => row.qps, better: 'higher', render: (row) => numberFormat.formatNumber(row.qps, 1) },
      { label: 'Recall', align: 'right', title: 'Share of the true nearest neighbours returned, averaged over the runs',
        value: (row) => row.recall, better: 'higher', render: (row) => numberFormat.formatMetric(row.recall, { format: 'percent', decimals: 2 }) },
      { label: 'p99 latency', align: 'right', title: 'Serial search (one query at a time), 99th percentile, averaged over the runs',
        value: (row) => row.latencyP99Ms, better: 'lower', render: (row) => numberFormat.formatWithUnit(row.latencyP99Ms, 1, 'ms') },
    ];
    return dataTable.DataTable({ columns, rows: props.rows, caption: 'QPS and recall' });
  }

  return { QpsRecallTable };
});
