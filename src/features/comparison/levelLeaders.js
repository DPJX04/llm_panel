/* For each concurrency level, the models ranked on one metric. Feeds the ranking and latency tables. */
BenchPanel.define('features/comparison/levelLeaders', [
  'constants/metricCatalog', 'utils/runCollection', 'utils/metricValues', 'utils/ranking',
], (metricCatalog, runCollection, metricValues, ranking) => {
  'use strict';

  /**
   * @returns {Array<{ level: number|null, ranked: Array<{ model: Object, run: Object, baseline: Object, value: number|null, rank: number|null }> }>}
   */
  function levelLeaders(models, runs, metricKey) {
    const better = metricCatalog.METRICS[metricKey].better;
    return runCollection.concurrencyLevels(runs).map((level) => {
      const entries = models
        .map((model) => {
          const run = runCollection.findRun(runs, model.key, level);
          const baseline = runCollection.baselineRun(runs, model.key);
          return run ? { model, run, baseline, value: metricValues.getMetricValue(run, metricKey, baseline) } : null;
        })
        .filter(Boolean);
      return { level, ranked: ranking.rankEntries(entries, better) };
    });
  }

  return { levelLeaders };
});
