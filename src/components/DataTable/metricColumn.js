/* Builds a DataTable column for one catalogued metric, so every table formats and highlights it the same way. */
BenchPanel.define('components/DataTable/metricColumn', [
  'components/dom', 'constants/metricCatalog', 'constants/rankingRules', 'utils/metricValues', 'utils/perUserMetric', 'utils/numberFormat',
], (dom, metricCatalog, rankingRules, metricValues, perUserMetric, numberFormat) => {
  'use strict';

  /**
   * @param {string} metricKey
   * @param {{ run: (row: any) => Object|null, baseline?: (row: any) => Object|null,
   *           label?: string, markWorst?: boolean, highlight?: boolean }} access
   */
  function metricColumn(metricKey, access) {
    const metric = metricCatalog.METRICS[metricKey];
    const value = (row) => metricValues.getMetricValue(access.run(row), metricKey, access.baseline ? access.baseline(row) : undefined);
    return {
      label: access.label || metric.label,
      title: `${metric.title}. ${metric.description}`,
      align: 'right',
      value,
      better: access.highlight === false ? undefined : metric.better,
      tieTolerance: metric.exact ? 0 : rankingRules.TIE_TOLERANCE,
      markWorst: Boolean(access.markWorst),
      // A value worked out differently from its column (Per user tok/s option A using option B) says so on hover.
      render: (row) => {
        const text = numberFormat.formatMetric(value(row), metric);
        const note = perUserMetric.valueNote(access.run(row), metricKey);
        return note ? dom.h('span', { className: 'cell-note', title: note, text }) : text;
      },
    };
  }

  return { metricColumn };
});
