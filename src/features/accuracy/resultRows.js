/*
 * One row per model for a question set: its report, the report's summary, and, when the model also has benchmark
 * runs, its speed under load from those runs, so quality and serving speed sit side by side.
 * Rows are ordered by accuracy, then by time per question.
 */
BenchPanel.define('features/accuracy/resultRows', [
  'utils/evalSummary', 'utils/evalReportCollection', 'utils/keyLevels', 'utils/runCollection',
], (evalSummary, evalReportCollection, keyLevels, runCollection) => {
  'use strict';

  function byAccuracyThenSpeed(a, b) {
    const accuracy = (b.summary.accuracy ?? -1) - (a.summary.accuracy ?? -1);
    if (accuracy !== 0) return accuracy;
    return (a.summary.meanTotalMs ?? Infinity) - (b.summary.meanTotalMs ?? Infinity);
  }

  /**
   * @param {Object[]} reports   every loaded report
   * @param {string} questionSetId
   * @param {Object[]} models    workspaceStore.getAllModels()
   * @param {Object[]} runs      every loaded benchmark run
   * @returns {{ rows: Array<{ report: Object, model: Object, summary: Object, peakRun: Object|null, lowRun: Object|null }>,
   *   levels: { low: number|null|undefined, peak: number|null|undefined } }}
   */
  function buildResultRows(reports, questionSetId, models, runs) {
    const forSet = evalReportCollection.reportsForQuestionSet(reports, questionSetId);
    const paired = forSet
      .map((report) => ({ report, model: models.find((model) => model.key === report.modelKey) }))
      .filter((pair) => pair.model);
    const benchKeys = paired.filter((pair) => pair.model.hasRuns).map((pair) => pair.model.key);
    const levels = benchKeys.length > 0 ? keyLevels.keyLevels(runs, benchKeys) : { low: undefined, peak: undefined };
    const rows = paired.map(({ report, model }) => ({
      report,
      model,
      summary: evalSummary.summarizeReport(report),
      peakRun: model.hasRuns ? runCollection.findRun(runs, model.key, levels.peak) : null,
      lowRun: model.hasRuns ? runCollection.findRun(runs, model.key, levels.low) : null,
    }));
    return { rows: rows.sort(byAccuracyThenSpeed), levels };
  }

  return { buildResultRows };
});
