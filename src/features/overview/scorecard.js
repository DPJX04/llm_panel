/*
 * The overall scorecard: each model's rank on five criteria users feel, averaged.
 * Equal weights on purpose, so the method is easy to explain and check by hand.
 */
BenchPanel.define('features/overview/scorecard', [
  'constants/metricCatalog', 'utils/runCollection', 'utils/metricValues', 'utils/ranking', 'utils/numberFormat',
], (metricCatalog, runCollection, metricValues, ranking, numberFormat) => {
  'use strict';

  function criteriaFor(levels) {
    const low = numberFormat.formatConcurrency(levels.low);
    const peak = numberFormat.formatConcurrency(levels.peak);
    const all = [
      { metricKey: 'outputThroughput', level: levels.peak, label: `Output TPS @C${peak}` },
      { metricKey: 'tokensPerRequest', level: levels.low, label: `Tok/s per request @C${low}` },
      { metricKey: 'meanTtftMs', level: levels.low, label: `Mean TTFT @C${low}` },
      { metricKey: 'meanTtftMs', level: levels.peak, label: `Mean TTFT @C${peak}` },
      { metricKey: 'meanE2eMs', level: levels.peak, label: `Mean E2E @C${peak}` },
    ];
    // With a single level tested, low and peak are the same, so drop the duplicates.
    return levels.low === levels.peak ? all.filter((criterion, index) => index !== 3) : all;
  }

  /**
   * @returns {{ criteria: Object[], rows: Array<{ model: Object, cells: Array<{ value: number|null, rank: number|null }>, averageRank: number|null, overallRank: number|null }> }}
   */
  function buildScorecard(models, runs, levels) {
    const criteria = criteriaFor(levels);
    const cellsByModel = new Map(models.map((model) => [model.key, []]));

    criteria.forEach((criterion) => {
      const better = metricCatalog.METRICS[criterion.metricKey].better;
      const entries = models.map((model) => ({
        key: model.key,
        value: metricValues.getMetricValue(runCollection.findRun(runs, model.key, criterion.level), criterion.metricKey),
      }));
      ranking.rankEntries(entries, better).forEach((entry) => cellsByModel.get(entry.key).push({ value: entry.value, rank: entry.rank }));
    });

    const rows = models.map((model) => {
      const cells = cellsByModel.get(model.key);
      const ranks = cells.map((cell) => cell.rank).filter((rank) => rank !== null);
      return { model, cells, averageRank: ranks.length > 0 ? ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length : null };
    });
    const ranked = ranking.rankEntries(rows.map((row) => ({ ...row, value: row.averageRank })), metricCatalog.LOWER);
    return { criteria, rows: ranked.map((row) => ({ ...row, overallRank: row.rank })) };
  }

  return { buildScorecard };
});
