/*
 * Picks the two concurrency levels the headline numbers are quoted at:
 * the lowest (single-user experience) and the peak (highest level every model was tested at).
 */
BenchPanel.define('utils/keyLevels', ['utils/runCollection'], (runCollection) => {
  'use strict';

  /**
   * @param {Object[]} runs
   * @param {string[]} modelKeys
   * @returns {{ low: number|null|undefined, peak: number|null|undefined, allShared: boolean }}
   *   undefined when there are no runs; peak falls back to the highest level overall
   */
  function keyLevels(runs, modelKeys) {
    const shared = runCollection.sharedConcurrencyLevels(runs, modelKeys);
    const all = runCollection.concurrencyLevels(runs);
    const levels = shared.length > 0 ? shared : all;
    return {
      low: levels[0],
      peak: levels[levels.length - 1],
      allShared: shared.length > 0,
    };
  }

  return { keyLevels };
});
