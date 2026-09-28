/*
 * Rules for a set of runs: one run per model per concurrency level (the newest wins),
 * plus lookups by model and level.
 */
BenchPanel.define('utils/runCollection', [], () => {
  'use strict';

  function slotKey(run) {
    return `${run.modelKey}@@${run.concurrency === null ? 'uncapped' : run.concurrency}`;
  }

  /** Sorts concurrency levels ascending, with "uncapped" (null) last. */
  function compareConcurrency(a, b) {
    if (a === b) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  }

  /**
   * Adds incoming runs. A run for a model and level that already has one replaces it
   * only if it is at least as new, so re-loading an old file never hides a newer result.
   * @returns {{ runs: Object[], added: number, replaced: number, skipped: number }}
   */
  function mergeRuns(existing, incoming) {
    const bySlot = new Map(existing.map((run) => [slotKey(run), run]));
    let added = 0;
    let replaced = 0;
    let skipped = 0;
    incoming.forEach((run) => {
      const key = slotKey(run);
      const current = bySlot.get(key);
      if (!current) added += 1;
      else if (run.date >= current.date) replaced += 1;
      else { skipped += 1; return; }
      bySlot.set(key, run);
    });
    return { runs: Array.from(bySlot.values()), added, replaced, skipped };
  }

  /** Every concurrency level tested by any of the runs, ascending. */
  function concurrencyLevels(runs) {
    return Array.from(new Set(runs.map((run) => run.concurrency))).sort(compareConcurrency);
  }

  /** Levels that every one of the given models was tested at. */
  function sharedConcurrencyLevels(runs, modelKeys) {
    return concurrencyLevels(runs).filter((level) =>
      modelKeys.every((key) => runs.some((run) => run.modelKey === key && run.concurrency === level)));
  }

  function runsForModel(runs, modelKey) {
    return runs
      .filter((run) => run.modelKey === modelKey)
      .sort((a, b) => compareConcurrency(a.concurrency, b.concurrency));
  }

  function findRun(runs, modelKey, concurrency) {
    return runs.find((run) => run.modelKey === modelKey && run.concurrency === concurrency) || null;
  }

  /** The model's lowest-concurrency run, which relative metrics compare against. */
  function baselineRun(runs, modelKey) {
    return runsForModel(runs, modelKey)[0] || null;
  }

  return { compareConcurrency, mergeRuns, concurrencyLevels, sharedConcurrencyLevels, runsForModel, findRun, baselineRun };
});
