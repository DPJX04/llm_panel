/*
 * The overall scorecard. On each criterion a model scores its value as a percentage of the best model's
 * (100% = best), so a model 17× slower loses far more than one 10% slower. The overall score is the
 * plain average, with equal weights, so it is easy to explain and check by hand.
 */
BenchPanel.define('features/overview/scorecard', [
  'constants/metricCatalog', 'constants/rankingRules', 'utils/runCollection', 'utils/metricValues', 'utils/ranking',
  'utils/numberFormat',
], (metricCatalog, rankingRules, runCollection, metricValues, ranking, numberFormat) => {
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

  /** The value as a share of the best value: 1 for the best model, less for the rest. */
  function shareOfBest(value, best, better) {
    if (typeof value !== 'number' || typeof best !== 'number' || value <= 0 || best <= 0) return null;
    return better === metricCatalog.HIGHER ? value / best : best / value;
  }

  /**
   * @returns {{ criteria: Object[], rows: Array<{ model: Object, cells: Array<{ value: number|null, score: number|null }>,
   *   score: number|null, rank: number|null, tied: boolean }> }}  rows best first
   */
  function buildScorecard(models, runs, levels) {
    const criteria = criteriaFor(levels);
    const rows = models.map((model) => ({ model, cells: [] }));

    criteria.forEach((criterion) => {
      const better = metricCatalog.METRICS[criterion.metricKey].better;
      const values = models.map((model) =>
        metricValues.getMetricValue(runCollection.findRun(runs, model.key, criterion.level), criterion.metricKey));
      const { best } = ranking.extremes(values, better);
      values.forEach((value, index) => rows[index].cells.push({ value, score: shareOfBest(value, best, better) }));
    });

    const scored = rows.map((row) => {
      const scores = row.cells.map((cell) => cell.score).filter((score) => score !== null);
      return { ...row, value: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null };
    });
    const ranked = ranking.rankEntries(scored, metricCatalog.HIGHER, rankingRules.TIE_TOLERANCE)
      .map(({ value, ...row }) => ({ ...row, score: value }));
    return { criteria, rows: ranked };
  }

  return { buildScorecard };
});
