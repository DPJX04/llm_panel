/* Rules for the set of loaded database runs: each run is kept once, however often its file is loaded. */
BenchPanel.define('utils/dbResultCollection', [], () => {
  'use strict';

  /**
   * Adds incoming runs to the existing ones. A run whose id is already there is the same run loaded again,
   * so it replaces the copy instead of being counted (and averaged) twice.
   * @returns {{ results: Object[], added: number, duplicates: number }}
   */
  function mergeDbResults(existing, incoming) {
    const byId = new Map(existing.map((entry) => [entry.id, entry]));
    let added = 0;
    let duplicates = 0;
    incoming.forEach((entry) => {
      if (byId.has(entry.id)) duplicates += 1;
      else added += 1;
      byId.set(entry.id, entry);
    });
    return { results: Array.from(byId.values()), added, duplicates };
  }

  return { mergeDbResults };
});
