/* The scorecard as a table: each criterion's value with its percentage of the best, then the overall score. */
BenchPanel.define('features/overview/ScorecardTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag', 'components/RankLabel/RankLabel',
  'constants/metricCatalog', 'constants/rankingRules', 'utils/numberFormat',
], (dom, dataTable, modelTag, rankLabel, metricCatalog, rankingRules, numberFormat) => {
  'use strict';

  function percent(score) {
    return `${numberFormat.formatNumber(score * 100, 0)}%`;
  }

  function ScoredValue(cell, metric) {
    return dom.h('span', { className: 'ranked-value' },
      numberFormat.formatMetric(cell.value, metric),
      cell.score !== null
        ? dom.h('span', { className: `rank-badge${cell.score >= 0.9995 ? ' rank-badge--first' : ''}`, text: percent(cell.score) })
        : null);
  }

  /** @param {{ scorecard: { criteria: Object[], rows: Object[] } }} props */
  function ScorecardTable(props) {
    const { criteria, rows } = props.scorecard;
    const columns = [
      { label: 'Overall', render: (row) => rankLabel.RankLabel({ rank: row.rank, tied: row.tied }) },
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      ...criteria.map((criterion, index) => {
        const metric = metricCatalog.METRICS[criterion.metricKey];
        return {
          label: criterion.label,
          title: `${metric.title}. ${metric.better === metricCatalog.HIGHER ? 'Higher' : 'Lower'} is better. The percentage is this value relative to the best model (100% = best).`,
          align: 'right',
          render: (row) => ScoredValue(row.cells[index], metric),
        };
      }),
      { label: 'Score', title: 'Average of the percentages in this row', align: 'right',
        value: (row) => row.score, better: metricCatalog.HIGHER, tieTolerance: rankingRules.TIE_TOLERANCE,
        render: (row) => (row.score === null ? numberFormat.MISSING : numberFormat.formatNumber(row.score * 100, 1)) },
    ];
    return dataTable.DataTable({ columns, rows, caption: 'Overall scorecard', rowClass: (row) => (row.rank === 1 ? 'is-leader' : '') });
  }

  return { ScorecardTable };
});
