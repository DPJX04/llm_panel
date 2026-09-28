/* For each concurrency level, the models ranked on one metric (gaps inside the tie tolerance share a rank). */
BenchPanel.define('features/comparison/levelLeaders', [
  'constants/metricCatalog', 'constants/rankingRules', 'utils/runCollection', 'utils/metricValues', 'utils/ranking',
], (metricCatalog, rankingRules, runCollection, metricValues, ranking) => {
  'use strict';

  /**
   * @returns {Array<{ level: number|null, ranked: Array<{ model: Object, run: Object, baseline: Object, value: number|null, rank: number|null, tied: boolean }> }>}
   */
  function levelLeaders(models, runs, metricKey) {
    const metric = metricCatalog.METRICS[metricKey];
    const tolerance = metric.exact ? 0 : rankingRules.TIE_TOLERANCE;
    return runCollection.concurrencyLevels(runs).map((level) => {
      const entries = models
        .map((model) => {
          const run = runCollection.findRun(runs, model.key, level);
          const baseline = runCollection.baselineRun(runs, model.key);
          return run ? { model, run, baseline, value: metricValues.getMetricValue(run, metricKey, baseline) } : null;
        })
        .filter(Boolean);
      return { level, ranked: ranking.rankEntries(entries, metric.better, tolerance) };
    });
  }

  return { levelLeaders };
});
