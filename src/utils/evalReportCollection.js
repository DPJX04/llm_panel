/*
 * Rules for a set of evaluation reports: one report per model per question set (the newest wins),
 * plus lookups by question set.
 */
BenchPanel.define('utils/evalReportCollection', [], () => {
  'use strict';

  function slotKey(report) {
    return `${report.modelKey}@@${report.questionSetId}`;
  }

  /**
   * Adds incoming reports. One for a model and question set that already has one replaces it only if it is at
   * least as new, so re-loading an old file never hides a newer run.
   * @returns {{ reports: Object[], added: number, replaced: number, skipped: number }}
   */
  function mergeEvalReports(existing, incoming) {
    const bySlot = new Map(existing.map((report) => [slotKey(report), report]));
    let added = 0;
    let replaced = 0;
    let skipped = 0;
    incoming.forEach((report) => {
      const key = slotKey(report);
      const current = bySlot.get(key);
      if (!current) added += 1;
      else if (report.createdAt >= current.createdAt) replaced += 1;
      else { skipped += 1; return; }
      bySlot.set(key, report);
    });
    return { reports: Array.from(bySlot.values()), added, replaced, skipped };
  }

  /** The question sets that have reports, most recently run first. @returns {Array<{ id: string, title: string }>} */
  function questionSetsOf(reports) {
    const latest = new Map();
    reports.forEach((report) => {
      const current = latest.get(report.questionSetId);
      if (!current || report.createdAt > current.createdAt) latest.set(report.questionSetId, report);
    });
    return Array.from(latest.values())
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
      .map((report) => ({ id: report.questionSetId, title: report.questionSetTitle }));
  }

  function reportsForQuestionSet(reports, questionSetId) {
    return reports.filter((report) => report.questionSetId === questionSetId);
  }

  return { mergeEvalReports, questionSetsOf, reportsForQuestionSet };
});
