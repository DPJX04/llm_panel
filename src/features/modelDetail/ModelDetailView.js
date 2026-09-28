/* The Model detail tab: everything about one model, picked from a drop-down. */
BenchPanel.define('features/modelDetail/ModelDetailView', [
  'components/dom', 'components/Section/Section', 'components/SelectField/SelectField', 'components/EmptyState/EmptyState',
  'components/MetricTrendChart/MetricTrendChart', 'store/workspaceStore', 'utils/runCollection', 'utils/numberFormat',
  'utils/hardwareSummary',
  'features/modelDetail/SummaryTable', 'features/modelDetail/TokenSpeedTable',
  'features/modelDetail/LatencyPercentileTable', 'features/modelDetail/RunDetailsTable',
], (dom, section, selectField, emptyState, metricTrendChart, workspaceStore, runCollection, numberFormat, hardwareSummary,
  summaryTable, tokenSpeedTable, latencyPercentileTable, runDetailsTable) => {
  'use strict';

  function profileLine(model) {
    const { modelSizeGb, kvCache } = model.profile;
    const gpu = hardwareSummary.summarizeGpus(model.profile);
    const memory = gpu.memoryUsedGb === null ? null
      : `Memory used ${numberFormat.formatNumber(gpu.memoryUsedGb, 2)} GB${gpu.occupancy === null ? '' : ` (${numberFormat.formatNumber(gpu.occupancy * 100, 0)}% of GPU)`}`;
    const parts = [
      `${gpu.gpuCount} GPU${gpu.gpuCount === 1 ? '' : 's'}`,
      modelSizeGb !== null ? `Weights ${numberFormat.formatNumber(modelSizeGb, 2)} GB` : null,
      memory,
      kvCache.sizeTokens !== null ? `KV cache ${numberFormat.formatNumber(kvCache.sizeTokens, 0)} tokens` : null,
      gpu.gpuUtilPct !== null ? `GPU util ${numberFormat.formatNumber(gpu.gpuUtilPct, 1)}%` : null,
      gpu.powerW !== null ? `Power ${numberFormat.formatNumber(gpu.powerW, 1)} W` : null,
    ].filter(Boolean);
    return parts.length > 1 ? parts.join(' · ') : 'No hardware details yet. Add them in the Data tab.';
  }

  function mountModelDetail(container, context) {
    let selectedKey = null;

    function build() {
      const models = workspaceStore.getModels();
      if (models.length === 0) {
        return emptyState.EmptyState({ title: 'No results loaded yet', message: 'Load vLLM benchmark result files to see each model in detail.',
          actionLabel: 'Go to Data', onAction: () => context.navigate('data') });
      }
      const model = models.find((candidate) => candidate.key === selectedKey) || models[0];
      selectedKey = model.key;
      const allRuns = workspaceStore.getState().runs;
      const runs = runCollection.runsForModel(allRuns, model.key);

      const picker = selectField.SelectField({
        label: 'Model',
        value: model.key,
        options: models.map((candidate) => ({ value: candidate.key, label: candidate.name })),
        onChange: (key) => { selectedKey = key; render(); },
      });

      return dom.h('div', { className: 'view-stack' },
        dom.h('div', { className: 'filter-bar' }, picker),
        section.Section({ title: model.modelId, description: profileLine(model) },
          dom.h('div', { className: 'chart-grid' },
            metricTrendChart.MetricTrendChart({ models: [model], runs: allRuns, metricKey: 'outputThroughput' }),
            metricTrendChart.MetricTrendChart({ models: [model], runs: allRuns, metricKey: 'tokensPerRequest' }))),
        section.Section({ title: 'Summary', description: 'Headline numbers at each concurrency level. Hover a column header for its meaning.' },
          summaryTable.SummaryTable({ runs })),
        section.Section({
          title: 'Token generation speed',
          description: 'How fast each user sees text appear. Tokens/sec ≈ 1000 ÷ TPOT (ms).',
          footnote: 'Scaling efficiency is Output TPS ÷ (concurrency × Output TPS at the lowest level); 100% means throughput grew in step with load.',
        }, tokenSpeedTable.TokenSpeedTable({ runs })),
        section.Section({ title: 'Latency percentiles', description: 'P50 is the typical request; P95 and P99 show what the slowest users experience.' },
          latencyPercentileTable.LatencyPercentileTable({ runs })),
        section.Section({ title: 'Run details' }, runDetailsTable.RunDetailsTable({ runs })));
    }

    function render() {
      dom.clear(container);
      container.appendChild(build());
    }

    render();
    return workspaceStore.subscribe(render);
  }

  return { mountModelDetail };
});
