/* The Overview tab: the one-page story for a reader who has two minutes. */
BenchPanel.define('features/overview/OverviewView', [
  'components/dom', 'components/Section/Section', 'components/StatTile/StatTile', 'components/EmptyState/EmptyState',
  'components/BarList/BarList', 'components/MetricTrendChart/MetricTrendChart', 'components/SettingsCheck/SettingsCheck',
  'store/workspaceStore', 'constants/metricCatalog', 'constants/rankingRules', 'utils/keyLevels', 'utils/runCollection', 'utils/metricValues',
  'utils/ranking', 'utils/numberFormat',
  'features/overview/highlights', 'features/overview/scorecard', 'features/overview/ScorecardTable', 'features/overview/ModelOverviewTable',
], (dom, section, statTile, emptyState, barList, metricTrendChart, settingsCheck, workspaceStore, metricCatalog, rankingRules, keyLevels,
  runCollection, metricValues, ranking, numberFormat, highlights, scorecard, scorecardTable, modelOverviewTable) => {
  'use strict';

  function summaryLine(models, runs) {
    const levels = runCollection.concurrencyLevels(runs).map(numberFormat.formatConcurrency);
    const dates = runs.map((run) => run.date).filter(Boolean).sort();
    const period = dates.length === 0 ? null
      : dates[0].slice(0, 8) === dates[dates.length - 1].slice(0, 8) ? `run ${numberFormat.formatRunDate(dates[0]).slice(0, 10)}`
        : `runs from ${numberFormat.formatRunDate(dates[0]).slice(0, 10)} to ${numberFormat.formatRunDate(dates[dates.length - 1]).slice(0, 10)}`;
    return [`${models.length} model${models.length === 1 ? '' : 's'}`, `${runs.length} run${runs.length === 1 ? '' : 's'}`, `concurrency ${levels.join(', ')}`, period]
      .filter(Boolean).join(' · ');
  }

  function RankedBars(models, runs, metricKey, level) {
    const metric = metricCatalog.METRICS[metricKey];
    const entries = models.map((model) => ({
      model,
      value: metricValues.getMetricValue(runCollection.findRun(runs, model.key, level), metricKey),
    }));
    const items = ranking.rankEntries(entries, metric.better)
      .map((entry) => ({ model: entry.model, value: entry.value, valueText: numberFormat.formatMetric(entry.value, metric) }));
    return barList.BarList({ items, ariaLabel: `${metric.title} at concurrency ${numberFormat.formatConcurrency(level)}` });
  }

  function mountOverview(container, context) {
    function build() {
      const models = workspaceStore.getModels();
      const runs = workspaceStore.getState().runs;
      if (models.length === 0) {
        return emptyState.EmptyState({
          title: 'No results loaded yet',
          message: 'Load the JSON result files from vLLM bench serve. Each file is one model at one concurrency level; load them all to compare.',
          actionLabel: 'Load results', onAction: () => context.navigate('data'),
        });
      }
      const levels = keyLevels.keyLevels(runs, models.map((model) => model.key));
      const low = numberFormat.formatConcurrency(levels.low);
      const peak = numberFormat.formatConcurrency(levels.peak);
      const levelNote = levels.allShared ? '' : ' Not every model was tested at the same levels, so some cells are empty.';

      return dom.h('div', { className: 'view-stack' },
        dom.h('div', { className: 'page-intro' },
          dom.h('h1', { className: 'page-intro__title', text: 'Benchmark summary' }),
          dom.h('p', { className: 'page-intro__meta', text: summaryLine(models, runs) })),
        settingsCheck.SettingsCheck({ runs, models }),
        dom.h('div', { className: 'stat-tiles' }, highlights.buildHighlights(models, runs, levels).map(statTile.StatTile)),
        section.Section({
          title: 'Overall scorecard',
          description: `Each model is scored on throughput under load, single-user speed, and latency. The percentage is the model's value relative to the best model (100% = best).${levelNote}`,
          footnote: `Score = average of the percentages, with equal weight. Models whose scores are within ${rankingRules.TIE_TOLERANCE_LABEL} share a rank, because single runs vary that much. Low load is concurrency ${low}; peak is concurrency ${peak}, the highest level every model was tested at.`,
        },scorecardTable.ScorecardTable({ scorecard: scorecard.buildScorecard(models, runs, levels) })),
        dom.h('div', { className: 'two-up' },
          section.Section({ title: `Capacity at concurrency ${peak}`, description: 'Output tokens per second across all users. Higher is better.' },
            RankedBars(models, runs, 'outputThroughput', levels.peak)),
          section.Section({ title: `Single-user speed at concurrency ${low}`, description: 'Tokens per second one user sees (1000 ÷ TPOT). Higher is better.' },
            RankedBars(models, runs, 'tokensPerRequest', levels.low))),
        section.Section({
          title: 'Throughput versus per-user speed',
          description: 'More users raise total throughput (left) but slow each user down (right). Hover a chart for exact values.',
        }, dom.h('div', { className: 'chart-grid' },
          metricTrendChart.MetricTrendChart({ models, runs, metricKey: 'outputThroughput' }),
          metricTrendChart.MetricTrendChart({ models, runs, metricKey: 'tokensPerRequest' }))),
        section.Section({ title: 'Model overview' }, modelOverviewTable.ModelOverviewTable({ models, runs })));
    }

    function render() {
      dom.clear(container);
      container.appendChild(build());
    }

    render();
    return workspaceStore.subscribe(render);
  }

  return { mountOverview };
});
