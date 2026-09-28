/*
 * Orders entries by a metric, respecting whether higher or lower is better.
 * Values within the tie tolerance of each other share a rank.
 */
BenchPanel.define('utils/ranking', ['constants/metricCatalog'], (metricCatalog) => {
  'use strict';

  function hasValue(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  /** Negative when `a` is better than `b`. */
  function compareValues(a, b, better) {
    return better === metricCatalog.LOWER ? a - b : b - a;
  }

  /** True when a and b differ by no more than `tolerance`, relative to the larger of the two. */
  function isWithin(a, b, tolerance) {
    const scale = Math.max(Math.abs(a), Math.abs(b));
    return scale === 0 || Math.abs(a - b) / scale <= (tolerance || 0);
  }

  /**
   * @template T
   * @param {Array<T & { value: number|null }>} entries
   * @param {'higher'|'lower'} better
   * @param {number} [tolerance]  relative gap that still counts as a tie; 0 means exact ties only
   * @returns {Array<T & { value: number|null, rank: number|null, tied: boolean }>}
   *   best first; missing values last with rank null
   */
  function rankEntries(entries, better, tolerance) {
    const withValue = entries.filter((entry) => hasValue(entry.value)).sort((a, b) => compareValues(a.value, b.value, better));
    const missing = entries.filter((entry) => !hasValue(entry.value));
    let rank = 0;
    let groupLeader = null;
    const ranked = withValue.map((entry, index) => {
      // Compare with the first value of the current tie group, so ties cannot chain across a wide range.
      if (index === 0 || !isWithin(entry.value, groupLeader, tolerance)) {
        rank = index + 1;
        groupLeader = entry.value;
      }
      return { ...entry, rank };
    });
    const groupSizes = new Map();
    ranked.forEach((entry) => groupSizes.set(entry.rank, (groupSizes.get(entry.rank) || 0) + 1));
    return ranked
      .map((entry) => ({ ...entry, tied: groupSizes.get(entry.rank) > 1 }))
      .concat(missing.map((entry) => ({ ...entry, rank: null, tied: false })));
  }

  /** The best and worst of a list of values, ignoring missing ones. */
  function extremes(values, better) {
    const present = values.filter(hasValue).sort((a, b) => compareValues(a, b, better));
    if (present.length === 0) return { best: null, worst: null };
    return { best: present[0], worst: present[present.length - 1] };
  }

  return { rankEntries, extremes, isWithin };
});
