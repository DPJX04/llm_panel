/* The scorecard as a table: value and rank per criterion, then the average rank that orders the rows. */
BenchPanel.define('features/overview/ScorecardTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'constants/metricCatalog', 'utils/numberFormat',
], (dom, dataTable, modelTag, metricCatalog, numberFormat) => {
  'use strict';

  function RankedValue(cell, metric) {
    return dom.h('span', { className: 'ranked-value' },
      numberFormat.formatMetric(cell.value, metric),
      cell.rank !== null ? dom.h('span', { className: `rank-badge${cell.rank === 1 ? ' rank-badge--first' : ''}`, text: `#${cell.rank}` }) : null);
  }

  /** @param {{ scorecard: ReturnType<typeof import('./scorecard').buildScorecard> }} props */
  function ScorecardTable(props) {
    const { criteria, rows } = props.scorecard;
    const columns = [
      { label: 'Overall', align: 'right', render: (row) => (row.overallRank === null ? numberFormat.MISSING : `#${row.overallRank}`) },
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      ...criteria.map((criterion, index) => {
        const metric = metricCatalog.METRICS[criterion.metricKey];
        return {
          label: criterion.label,
          title: `${metric.title}. ${metric.better === metricCatalog.HIGHER ? 'Higher' : 'Lower'} is better.`,
          align: 'right',
          value: (row) => row.cells[index].value,
          better: metric.better,
          render: (row) => RankedValue(row.cells[index], metric),
        };
      }),
      { label: 'Avg rank', align: 'right', value: (row) => row.averageRank, better: metricCatalog.LOWER,
        render: (row) => numberFormat.formatNumber(row.averageRank, 1) },
    ];
    return dataTable.DataTable({ columns, rows, caption: 'Overall scorecard', rowClass: (row) => (row.overallRank === 1 ? 'is-leader' : '') });
  }

  return { ScorecardTable };
});
