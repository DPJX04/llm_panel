/* How well each model turns extra load into extra throughput, and how much per-user speed it gives up. */
BenchPanel.define('features/comparison/ScalingSection', [
  'components/Section/Section', 'features/comparison/MetricMatrixTable',
], (section, metricMatrixTable) => {
  'use strict';

  /** @param {{ models: Object[], runs: Object[] }} props */
  function ScalingSection(props) {
    return section.Section({
      title: 'Scaling under load',
      description: 'Both are relative to each model\'s own lowest-concurrency run, so they compare how gracefully models scale rather than raw speed.',
      footnote: 'Scaling efficiency = Output TPS ÷ (concurrency × Output TPS at the lowest level). Speed kept = tok/s per request ÷ tok/s per request at the lowest level.',
    },
    section.SubSection({ title: 'Throughput scaling efficiency', description: '100% means doubling the users doubled total output. Higher is better.' },
      metricMatrixTable.MetricMatrixTable({ models: props.models, runs: props.runs, metricKey: 'scalingEfficiency' })),
    section.SubSection({ title: 'Per-request speed kept', description: 'Share of single-user generation speed each user still gets. Higher is better.' },
      metricMatrixTable.MetricMatrixTable({ models: props.models, runs: props.runs, metricKey: 'speedRetention' })));
  }

  return { ScalingSection };
});
