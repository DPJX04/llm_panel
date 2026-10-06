/*
 * The headline numbers above one dataset's charts: highest QPS, best recall and lowest p99 latency. Each tile names the
 * database and ef search that set it, and the trade-off beside it (fast at what recall, accurate at what speed).
 */
BenchPanel.define('features/vectorDb/headlineTiles', ['utils/numberFormat'], (numberFormat) => {
  'use strict';

  /** The ef search the value came from, e.g. "ef 64". */
  function efText(row) {
    return row.efSearch === null ? 'ef not set' : `ef ${row.efSearch}`;
  }

  /** A recall as a percentage, e.g. "99.52%". */
  function percent(value) {
    return numberFormat.formatMetric(value, { format: 'percent', decimals: 2 });
  }

  /** The row with the best value of a metric, or null when no row has the metric. Equal values keep the first row. */
  function bestRow(rows, metricKey, better) {
    return rows.filter((row) => typeof row[metricKey] === 'number').reduce((best, row) => {
      if (!best) return row;
      const isBetter = better === 'higher' ? row[metricKey] > best[metricKey] : row[metricKey] < best[metricKey];
      return isBetter ? row : best;
    }, null);
  }

  /**
   * @param {Object[]} rows  averaged rows with their line name and colour (dbResultCharts.withLines)
   * @returns {Object[]}  StatTile options in display order; a metric no row has gets no tile
   */
  function buildHeadlineTiles(rows) {
    const fastest = bestRow(rows, 'qps', 'higher');
    const mostAccurate = bestRow(rows, 'recall', 'higher');
    const quickest = bestRow(rows, 'latencyP99Ms', 'lower');
    return [
      fastest && {
        label: 'Highest QPS',
        value: numberFormat.formatNumber(fastest.qps, 1),
        model: fastest,
        context: `${efText(fastest)} · recall ${percent(fastest.recall)}`,
      },
      mostAccurate && {
        label: 'Best recall',
        value: percent(mostAccurate.recall),
        model: mostAccurate,
        context: `${efText(mostAccurate)} · ${numberFormat.formatNumber(mostAccurate.qps, 1)} QPS`,
      },
      quickest && {
        label: 'Lowest p99 latency',
        value: numberFormat.formatWithUnit(quickest.latencyP99Ms, 1, 'ms'),
        model: quickest,
        context: `${efText(quickest)} · one query at a time`,
      },
    ].filter(Boolean);
  }

  return { buildHeadlineTiles };
});
