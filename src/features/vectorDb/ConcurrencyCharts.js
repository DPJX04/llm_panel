/*
 * QPS and p99 latency against concurrency for one card, side by side like the Overview tab's charts.
 * Hover a chart, or focus it and use the arrow keys, for exact values.
 */
BenchPanel.define('features/vectorDb/ConcurrencyCharts', [
  'components/dom', 'components/LineChart/LineChart', 'utils/dbResultCharts', 'utils/numberFormat',
], (dom, lineChart, dbResultCharts, numberFormat) => {
  'use strict';

  /** One titled line chart of a trend from dbResultCharts.concurrencyTrend. */
  function Chart(title, trend, better, formatValue) {
    return dom.h('div', { className: 'vector-db-chart' },
      dom.h('h3', { className: 'chart-title', text: title }),
      lineChart.LineChart({
        xValues: trend.xValues,
        xLabel: 'Concurrent queries',
        formatX: (value) => String(value),
        series: trend.series,
        formatValue,
        formatTick: (value) => numberFormat.formatTick(value, {}),
        better,
        ariaLabel: `${title} by concurrent queries for ${trend.series.map((line) => line.name).join(', ')}`,
      }));
  }

  /** @param {{ rows: Object[] }} props  the rows of one card, with their line names and colours */
  function ConcurrencyCharts(props) {
    return dom.h('div', { className: 'chart-grid' },
      Chart('QPS', dbResultCharts.concurrencyTrend(props.rows, 'qps'), 'higher',
        (value) => numberFormat.formatNumber(value, 1)),
      Chart('p99 latency (ms)', dbResultCharts.concurrencyTrend(props.rows, 'latencyP99Ms'), 'lower',
        (value) => numberFormat.formatWithUnit(value, 1, 'ms')));
  }

  return { ConcurrencyCharts };
});
