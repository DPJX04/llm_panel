/*
 * The headline winners: best throughput under load, fastest first token, fastest per-user
 * generation, best latency under load, and (when hardware is entered) best throughput per GB.
 */
BenchPanel.define('features/overview/highlights', [
  'constants/metricCatalog', 'utils/runCollection', 'utils/metricValues', 'utils/ranking', 'utils/numberFormat',
], (metricCatalog, runCollection, metricValues, ranking, numberFormat) => {
  'use strict';

  function lead(winner, runnerUp, better) {
    if (!runnerUp || !winner.value || !runnerUp.value) return null;
    if (better === metricCatalog.HIGHER) {
      return `${numberFormat.formatNumber((winner.value / runnerUp.value - 1) * 100, 1)}% ahead of ${runnerUp.model.name}`;
    }
    return `${numberFormat.formatNumber((runnerUp.value / winner.value - 1) * 100, 1)}% faster than ${runnerUp.model.name}`;
  }

  function highlight(label, entries, metric, context) {
    const ranked = ranking.rankEntries(entries, metric.better).filter((entry) => entry.value !== null);
    if (ranked.length === 0) return null;
    return {
      label,
      value: numberFormat.formatMetric(ranked[0].value, metric),
      model: ranked[0].model,
      detail: lead(ranked[0], ranked[1], metric.better),
      context,
    };
  }

  function metricEntries(models, runs, metricKey, level) {
    return models.map((model) => ({
      model,
      value: metricValues.getMetricValue(runCollection.findRun(runs, model.key, level), metricKey),
    }));
  }

  /**
   * @param {Object[]} models
   * @param {Object[]} runs
   * @param {{ low: number|null, peak: number|null }} levels
   * @returns {Object[]}  StatTile options, in display order
   */
  function buildHighlights(models, runs, levels) {
    const { METRICS } = metricCatalog;
    const low = numberFormat.formatConcurrency(levels.low);
    const peak = numberFormat.formatConcurrency(levels.peak);

    const tiles = [
      highlight('Highest throughput', metricEntries(models, runs, 'outputThroughput', levels.peak),
        { ...METRICS.outputThroughput, unit: 'tok/s' }, `Output tokens/s at concurrency ${peak}`),
      highlight('Fastest per-user generation', metricEntries(models, runs, 'tokensPerRequest', levels.low),
        METRICS.tokensPerRequest, `Tok/s per request at concurrency ${low}`),
      highlight('Fastest first token', metricEntries(models, runs, 'meanTtftMs', levels.low),
        METRICS.meanTtftMs, `Mean TTFT at concurrency ${low}`),
      highlight('Fastest full answer under load', metricEntries(models, runs, 'meanE2eMs', levels.peak),
        METRICS.meanE2eMs, `Mean end-to-end latency at concurrency ${peak}`),
    ];

    const perGb = models.map((model) => {
      const run = runCollection.findRun(runs, model.key, levels.peak);
      const vram = model.profile.vramGb;
      return { model, value: run && vram ? run.outputThroughput / vram : null };
    });
    if (perGb.filter((entry) => entry.value !== null).length >= 2) {
      tiles.push(highlight('Best memory efficiency', perGb,
        { format: 'fixed', decimals: 2, unit: 'TPS/GB', better: metricCatalog.HIGHER }, `Output TPS per GB of VRAM at concurrency ${peak}`));
    }
    return tiles.filter(Boolean);
  }

  return { buildHighlights };
});
