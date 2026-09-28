/* The Compare tab: every model side by side. Each part can be shown or hidden; the choice is remembered. */
BenchPanel.define('features/comparison/ComparisonView', [
  'components/dom', 'components/SelectField/SelectField', 'components/EmptyState/EmptyState', 'components/SettingsCheck/SettingsCheck',
  'store/workspaceStore', 'services/preferencesService', 'constants/metricCatalog', 'utils/keyLevels',
  'features/comparison/SectionToggles', 'features/comparison/hardwareRows',
  'features/comparison/MetricTrendSection', 'features/comparison/ConcurrencyRankingSection', 'features/comparison/LatencySection',
  'features/comparison/ScalingSection', 'features/comparison/GpuUsageSection', 'features/comparison/MemorySection',
  'features/comparison/KvCacheSection',
], (dom, selectField, emptyState, settingsCheck, workspaceStore, preferencesService, metricCatalog, keyLevels,
  sectionToggles, hardwareRows, metricTrendSection, concurrencyRankingSection, latencySection, scalingSection,
  gpuUsageSection, memorySection, kvCacheSection) => {
  'use strict';

  const HIDDEN_PREFERENCE = 'compare.hiddenSections';

  const SECTIONS = [
    { id: 'trend', label: 'Focus metric chart', render: (ctx) => metricTrendSection.MetricTrendSection(ctx.props) },
    { id: 'ranking', label: 'Rankings', render: (ctx) => concurrencyRankingSection.ConcurrencyRankingSection(ctx.props) },
    { id: 'latency', label: 'Latency', render: (ctx) => latencySection.LatencySection(ctx.props) },
    { id: 'scaling', label: 'Scaling', render: (ctx) => scalingSection.ScalingSection(ctx.props) },
    { id: 'gpu', label: 'GPU usage', render: (ctx) => gpuUsageSection.GpuUsageSection(ctx.hardware) },
    { id: 'memory', label: 'Memory', render: (ctx) => memorySection.MemorySection(ctx.hardware) },
    { id: 'kv', label: 'KV cache', render: (ctx) => kvCacheSection.KvCacheSection(ctx.hardware) },
  ];

  function mountComparison(container, context) {
    let focusKey = 'outputThroughput';
    const saved = preferencesService.load(HIDDEN_PREFERENCE, []);
    const hidden = new Set(Array.isArray(saved) ? saved.filter((id) => SECTIONS.some((item) => item.id === id)) : []);

    function toggle(id) {
      if (hidden.has(id)) hidden.delete(id);
      else hidden.add(id);
      preferencesService.save(HIDDEN_PREFERENCE, Array.from(hidden));
      render();
    }

    function build() {
      const models = workspaceStore.getModels();
      const runs = workspaceStore.getState().runs;
      if (models.length === 0) {
        return emptyState.EmptyState({ title: 'No results loaded yet', message: 'Load result files for two or more models to compare them.',
          actionLabel: 'Go to Data', onAction: () => context.navigate('data') });
      }
      const levels = keyLevels.keyLevels(runs, models.map((model) => model.key));
      const ctx = {
        props: { models, runs, focusKey },
        hardware: { rows: hardwareRows.hardwareRows(models, runs, levels.peak), peakLevel: levels.peak, onEditHardware: () => context.navigate('data') },
      };

      const focusPicker = selectField.SelectField({
        label: 'Rank and chart by',
        value: focusKey,
        options: metricCatalog.FOCUS_METRIC_KEYS.map((key) => ({ value: key, label: metricCatalog.METRICS[key].title })),
        onChange: (key) => { focusKey = key; render(); },
      });

      return dom.h('div', { className: 'view-stack' },
        dom.h('div', { className: 'filter-bar' }, focusPicker,
          sectionToggles.SectionToggles({ sections: SECTIONS, hidden, onToggle: toggle })),
        settingsCheck.SettingsCheck({ runs, models }),
        SECTIONS.filter((item) => !hidden.has(item.id)).map((item) => item.render(ctx)));
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
