/* Builds a DataTable column for one catalogued metric, so every table formats and highlights it the same way. */
BenchPanel.define('components/DataTable/metricColumn', [
  'constants/metricCatalog', 'utils/metricValues', 'utils/numberFormat',
], (metricCatalog, metricValues, numberFormat) => {
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
      markWorst: Boolean(access.markWorst),
      render: (row) => numberFormat.formatMetric(value(row), metric),
    };
  }

  return { metricColumn };
});
