/* How well each model turns extra load into extra throughput. */
BenchPanel.define('features/comparison/ScalingSection', [
  'components/Section/Section', 'features/comparison/MetricMatrixTable',
], (section, metricMatrixTable) => {
  'use strict';

  /** @param {{ models: Object[], runs: Object[] }} props */
  function ScalingSection(props) {
    return section.Section({
      title: 'Throughput scaling efficiency',
      description: '100% means doubling the users doubled total output. Relative to each model\'s own lowest-concurrency run, so it compares how gracefully models scale rather than raw speed. Higher is better.',
      footnote: 'Scaling efficiency = Output TPS ÷ (concurrency × Output TPS at the lowest level). Where it drops sharply, the GPU is saturated.',
    }, metricMatrixTable.MetricMatrixTable({ models: props.models, runs: props.runs, metricKey: 'scalingEfficiency' }));
  }

  return { ScalingSection };
});
