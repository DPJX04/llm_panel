/* The focus metric across every concurrency level: a chart for the shape, a grid for the exact numbers. */
BenchPanel.define('features/comparison/MetricTrendSection', [
  'components/Section/Section', 'components/MetricTrendChart/MetricTrendChart', 'constants/metricCatalog',
  'features/comparison/MetricMatrixTable',
], (section, metricTrendChart, metricCatalog, metricMatrixTable) => {
  'use strict';

  /** @param {{ models: Object[], runs: Object[], focusKey: string }} props */
  function MetricTrendSection(props) {
    const metric = metricCatalog.METRICS[props.focusKey];
    return section.Section({
      title: `${metric.title} across concurrency`,
      description: `${metric.description} ${metric.better === metricCatalog.HIGHER ? 'Higher' : 'Lower'} is better.`,
    },
    metricTrendChart.MetricTrendChart({ models: props.models, runs: props.runs, metricKey: props.focusKey, title: null }),
    metricMatrixTable.MetricMatrixTable({ models: props.models, runs: props.runs, metricKey: props.focusKey }));
  }

  return { MetricTrendSection };
});
