/*
 * The charts for one dataset, laid out like a benchmark slide: QPS against recall on the left; QPS and recall at
 * each ef search value on the right. Recall can be shown as bars or dots.
 */
BenchPanel.define('features/vectorDb/ComparisonCharts', [
  'components/dom', 'components/SelectField/SelectField', 'utils/dbResultCharts', 'utils/numberFormat',
  'features/vectorDb/QpsRecallChart', 'features/vectorDb/GroupedColumnChart',
], (dom, selectField, dbResultCharts, numberFormat, qpsRecallChart, groupedColumnChart) => {
  'use strict';

  const RECALL_MARKS = Object.freeze([{ value: 'bar', label: 'Bars' }, { value: 'dot', label: 'Dots' }]);

  // What the zoomed recall axis means for each way of drawing it.
  const RECALL_NOTES = Object.freeze({
    bar: 'The axis starts near the data, not at 0%, so bar heights exaggerate the gaps. The values on top are exact.',
    dot: 'The axis starts near the data, not at 0%, so small gaps show. Each dot sits at its value.',
  });

  /** The line under the QPS-versus-recall title, e.g. "QdrantLocal: 1.5× the QPS of ArcadeDB on average (ef 64, 128, 256)". */
  function leadText(lead) {
    if (!lead) return null;
    return `${lead.leader}: ${numberFormat.formatWithUnit(lead.ratio, 1, '×')} the QPS of ${lead.runnerUp} on average (ef ${lead.efValues.join(', ')})`;
  }

  /** A chart with its title (and an optional control beside it), then an optional note. */
  function TitledChart(title, note, chart, control) {
    return dom.h('div', { className: 'vector-db-chart' },
      dom.h('div', { className: 'vector-db-chart__header' },
        dom.h('h3', { className: 'chart-title', text: title }),
        control || null),
      note ? dom.h('p', { className: 'vector-db-chart__note', text: note }) : null,
      chart);
  }

  /**
   * @param {{ rows: Object[], caseName: string, recallMark: 'bar'|'dot', onRecallMark: (mark: string) => void }} props
   *   rows: the averaged rows of one dataset, with their line names and colours
   */
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
        TitledChart('Recall at each ef search', RECALL_NOTES[props.recallMark],
          groupedColumnChart.GroupedColumnChart({
            ...dbResultCharts.columnGroups(props.rows, 'recall'),
            mark: props.recallMark,
            zoomAxis: true,
            formatValue: (value) => numberFormat.formatMetric(value, { format: 'percent', decimals: 1 }),
            formatTick: (value) => numberFormat.formatTick(value, { format: 'percent' }),
            ariaLabel: `Recall at each ef search on ${props.caseName}, one ${props.recallMark} per database`,
          }),
          selectField.SelectField({ label: 'Show as', value: props.recallMark, options: RECALL_MARKS, onChange: props.onRecallMark }))));
  }

  return { RECALL_MARKS, ComparisonCharts };
});
