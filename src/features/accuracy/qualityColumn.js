/* Builds a DataTable column for one quality metric, so every accuracy table formats and highlights it the same way. */
BenchPanel.define('features/accuracy/qualityColumn', [
  'constants/qualityMetricCatalog', 'constants/rankingRules', 'utils/numberFormat',
], (qualityMetricCatalog, rankingRules, numberFormat) => {
  'use strict';

  /** @param {string} metricKey  @param {(row: any) => number|null} value */
  function qualityColumn(metricKey, value) {
    const metric = qualityMetricCatalog.QUALITY_METRICS[metricKey];
    return {
      label: metric.label,
      title: `${metric.title}. ${metric.description}`,
      align: 'right',
      value,
      better: metric.better,
      tieTolerance: metric.exact ? 0 : rankingRules.TIE_TOLERANCE,
      render: (row) => numberFormat.formatMetric(value(row), metric),
    };
  }

  return { qualityColumn };
});
