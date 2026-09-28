/* Orders entries by a metric, respecting whether higher or lower is better. Ties share a rank. */
BenchPanel.define('utils/ranking', ['constants/metricCatalog'], (metricCatalog) => {
  'use strict';

  function hasValue(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  /** Negative when `a` is better than `b`. */
  function compareValues(a, b, better) {
    return better === metricCatalog.LOWER ? a - b : b - a;
  }

  /**
   * @template T
   * @param {Array<T & { value: number|null }>} entries
   * @param {'higher'|'lower'} better
   * @returns {Array<T & { value: number|null, rank: number|null }>}  best first, missing values last with rank null
   */
  function rankEntries(entries, better) {
    const withValue = entries.filter((entry) => hasValue(entry.value)).sort((a, b) => compareValues(a.value, b.value, better));
    const missing = entries.filter((entry) => !hasValue(entry.value));
    let rank = 0;
    const ranked = withValue.map((entry, index) => {
      if (index === 0 || entry.value !== withValue[index - 1].value) rank = index + 1;
      return { ...entry, rank };
    });
    return ranked.concat(missing.map((entry) => ({ ...entry, rank: null })));
  }

  /** The best and worst of a list of values, ignoring missing ones. */
  function extremes(values, better) {
    const present = values.filter(hasValue).sort((a, b) => compareValues(a, b, better));
    if (present.length === 0) return { best: null, worst: null };
    return { best: present[0], worst: present[present.length - 1] };
  }

  return { rankEntries, extremes };
});
