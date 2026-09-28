/* One catalogued metric across concurrency levels, one line per model. */
BenchPanel.define('components/MetricTrendChart/MetricTrendChart', [
  'components/dom', 'components/LineChart/LineChart', 'constants/metricCatalog',
  'utils/runCollection', 'utils/metricValues', 'utils/numberFormat',
], (dom, lineChart, metricCatalog, runCollection, metricValues, numberFormat) => {
  'use strict';

  /**
   * @param {{ models: Object[], runs: Object[], metricKey: string, title?: string|null }} props  title null hides it
   */
  function MetricTrendChart(props) {
    const metric = metricCatalog.METRICS[props.metricKey];
    const levels = runCollection.concurrencyLevels(props.runs.filter((run) => props.models.some((model) => model.key === run.modelKey)));
    const series = props.models.map((model) => {
      const baseline = runCollection.baselineRun(props.runs, model.key);
      return {
        name: model.name,
        colorSlot: model.colorSlot,
        values: levels.map((level) => metricValues.getMetricValue(runCollection.findRun(props.runs, model.key, level), props.metricKey, baseline)),
      };
    });

    return dom.h('div', { className: 'metric-trend' },
      props.title === null ? null : dom.h('h3', { className: 'metric-trend__title', text: props.title || metric.title }),
      lineChart.LineChart({
        xValues: levels,
        xLabel: 'Concurrent requests',
        formatX: numberFormat.formatConcurrency,
        series,
        formatValue: (value) => numberFormat.formatMetric(value, metric),
        formatTick: (value) => numberFormat.formatTick(value, metric),
        better: metric.better,
        ariaLabel: `${metric.title} by concurrency for ${props.models.map((model) => model.name).join(', ')}`,
      }));
  }

  return { MetricTrendChart };
});
