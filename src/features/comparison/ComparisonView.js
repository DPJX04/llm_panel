/* The Compare tab: every model side by side, ranked and charted by one focus metric. */
BenchPanel.define('features/comparison/ComparisonView', [
  'components/dom', 'components/SelectField/SelectField', 'components/EmptyState/EmptyState',
  'store/workspaceStore', 'constants/metricCatalog', 'utils/keyLevels',
  'features/comparison/ConcurrencyRankingSection', 'features/comparison/MetricTrendSection',
  'features/comparison/LatencySection', 'features/comparison/ScalingSection', 'features/comparison/GpuEfficiencySection',
], (dom, selectField, emptyState, workspaceStore, metricCatalog, keyLevels,
  concurrencyRankingSection, metricTrendSection, latencySection, scalingSection, gpuEfficiencySection) => {
  'use strict';

  function mountComparison(container, context) {
    let focusKey = 'outputThroughput';

    function build() {
      const models = workspaceStore.getModels();
      const runs = workspaceStore.getState().runs;
      if (models.length === 0) {
        return emptyState.EmptyState({ title: 'No results loaded yet', message: 'Load result files for two or more models to compare them.',
          actionLabel: 'Go to Data', onAction: () => context.navigate('data') });
      }
      const levels = keyLevels.keyLevels(runs, models.map((model) => model.key));

      const focusPicker = selectField.SelectField({
        label: 'Rank and chart by',
        value: focusKey,
        options: metricCatalog.FOCUS_METRIC_KEYS.map((key) => ({ value: key, label: metricCatalog.METRICS[key].title })),
        onChange: (key) => { focusKey = key; render(); },
      });

      const props = { models, runs, focusKey };
      return dom.h('div', { className: 'view-stack' },
        dom.h('div', { className: 'filter-bar' }, focusPicker),
        metricTrendSection.MetricTrendSection(props),
        concurrencyRankingSection.ConcurrencyRankingSection(props),
        latencySection.LatencySection(props),
        scalingSection.ScalingSection(props),
        gpuEfficiencySection.GpuEfficiencySection({ models, runs, peakLevel: levels.peak, onEditHardware: () => context.navigate('data') }));
    }

    function render() {
      dom.clear(container);
      container.appendChild(build());
    }

    render();
    return workspaceStore.subscribe(render);
  }

  return { mountComparison };
});
