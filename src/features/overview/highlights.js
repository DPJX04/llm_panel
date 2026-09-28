/*
 * The headline winners: best throughput under load, fastest per-user generation, fastest first token,
 * fastest full answer under load, and (when GPU memory is entered) best throughput per GB.
 * A lead inside the tie tolerance is reported as a tie, not a win.
 */
BenchPanel.define('features/overview/highlights', [
  'constants/metricCatalog', 'constants/rankingRules', 'utils/runCollection', 'utils/metricValues', 'utils/ranking',
  'utils/numberFormat', 'utils/hardwareSummary',
], (metricCatalog, rankingRules, runCollection, metricValues, ranking, numberFormat, hardwareSummary) => {
  'use strict';

  function lead(winner, runnerUp, metric, tolerance) {
    if (!runnerUp || !winner.value || !runnerUp.value) return { text: null, tone: 'good' };
    if (ranking.isWithin(winner.value, runnerUp.value, tolerance)) {
      return { text: `≈ tie with ${runnerUp.model.name} (within ${rankingRules.TIE_TOLERANCE_LABEL})`, tone: 'neutral' };
    }
    if (metric.better === metricCatalog.HIGHER) {
      return { text: `${numberFormat.formatNumber((winner.value / runnerUp.value - 1) * 100, 1)}% ahead of ${runnerUp.model.name}`, tone: 'good' };
    }
    return { text: `${numberFormat.formatNumber((runnerUp.value / winner.value - 1) * 100, 1)}% faster than ${runnerUp.model.name}`, tone: 'good' };
  }

  function highlight(label, entries, metric, context) {
    const tolerance = metric.exact ? 0 : rankingRules.TIE_TOLERANCE;
    const ranked = ranking.rankEntries(entries, metric.better, tolerance).filter((entry) => entry.value !== null);
    if (ranked.length === 0) return null;
    const detail = lead(ranked[0], ranked[1], metric, tolerance);
    return {
      label,
      value: numberFormat.formatMetric(ranked[0].value, metric),
      model: ranked[0].model,
      detail: detail.text,
      detailTone: detail.tone,
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
      return { model, value: run ? hardwareSummary.memoryEfficiency(model.profile, run.outputThroughput).tpsPerGb : null };
    });
    if (perGb.filter((entry) => entry.value !== null).length >= 2) {
      tiles.push(highlight('Best memory efficiency', perGb,
        { format: 'fixed', decimals: 2, unit: 'TPS/GB', better: metricCatalog.HIGHER },
        `Output TPS per GB of GPU memory used, at concurrency ${peak}`));
    }
    return tiles.filter(Boolean);
  }

  return { buildHighlights };
});
