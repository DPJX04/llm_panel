/*
 * The charts for one dataset, laid out like a benchmark slide: QPS against recall on the left; QPS and recall at
 * each ef search value on the right.
 */
BenchPanel.define('features/vectorDb/ComparisonCharts', [
  'components/dom', 'utils/dbResultCharts', 'utils/numberFormat',
  'features/vectorDb/QpsRecallChart', 'features/vectorDb/GroupedColumnChart',
], (dom, dbResultCharts, numberFormat, qpsRecallChart, groupedColumnChart) => {
  'use strict';

  /** The line under the QPS-versus-recall title, e.g. "QdrantLocal: 1.5× the QPS of ArcadeDB on average (ef 64, 128, 256)". */
  function leadText(lead) {
    if (!lead) return null;
    return `${lead.leader}: ${numberFormat.formatWithUnit(lead.ratio, 1, '×')} the QPS of ${lead.runnerUp} on average (ef ${lead.efValues.join(', ')})`;
  }

  /** A chart with its title and an optional note between them. */
  function TitledChart(title, note, chart) {
    return dom.h('div', { className: 'vector-db-chart' },
      dom.h('h3', { className: 'chart-title', text: title }),
      note ? dom.h('p', { className: 'vector-db-chart__note', text: note }) : null,
      chart);
  }

  /** @param {{ rows: Object[], caseName: string }} props  the averaged rows of one dataset, with their line names and colours */
  function ComparisonCharts(props) {
    const lines = dbResultCharts.tradeoffLines(props.rows);
    return dom.h('div', { className: 'chart-grid' },
      TitledChart('QPS vs recall', leadText(dbResultCharts.qpsLead(lines)), qpsRecallChart.QpsRecallChart({
        lines,
        ariaLabel: `QPS against recall on ${props.caseName}, one line per database, one point per ef search value`,
      })),
      dom.h('div', { className: 'vector-db-chart-stack' },
        TitledChart('QPS at each ef search', null, groupedColumnChart.GroupedColumnChart({
          ...dbResultCharts.columnGroups(props.rows, 'qps'),
          mark: 'bar',
          formatValue: (value) => numberFormat.formatNumber(value, 0),
          formatTick: (value) => numberFormat.formatTick(value, {}),
          ariaLabel: `QPS at each ef search on ${props.caseName}, one bar per database`,
        })),
        TitledChart('Recall at each ef search', 'Dots on an axis that starts near the data: as bars from 0%, 97% and 99% would look the same.',
          groupedColumnChart.GroupedColumnChart({
            ...dbResultCharts.columnGroups(props.rows, 'recall'),
            mark: 'dot',
            formatValue: (value) => numberFormat.formatMetric(value, { format: 'percent', decimals: 1 }),
            formatTick: (value) => numberFormat.formatTick(value, { format: 'percent' }),
            ariaLabel: `Recall at each ef search on ${props.caseName}, one dot per database`,
          }))));
  }

  return { ComparisonCharts };
});
