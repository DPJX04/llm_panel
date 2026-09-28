/*
 * Finds benchmark records inside whatever shape a combined file has: a bare record, an array,
 * a wrapper such as {"results": [...]}, or an object keyed by concurrency such as {"c16": {...}}.
 */
BenchPanel.define('utils/recordFinder', [], () => {
  'use strict';

  const MAX_DEPTH = 3;
  const CONCURRENCY_KEY = /^(?:c|conc|concurrency)?[\s_-]?(\d+)$/i;

  function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function isRecord(value) {
    return isPlainObject(value) && 'model_id' in value;
  }

  function containsRecord(value, depth) {
    if (isRecord(value)) return true;
    if (depth >= MAX_DEPTH || typeof value !== 'object' || value === null) return false;
    return Object.values(value).some((child) => containsRecord(child, depth + 1));
  }

  /** "16", "c16", "concurrency_16" → 16; anything else → null */
  function concurrencyFromKey(key) {
    const match = CONCURRENCY_KEY.exec(String(key).trim());
    return match ? Number(match[1]) : null;
  }

  function collect(value, concurrencyHint, depth, found) {
    if (Array.isArray(value)) {
      value.forEach((item) => collect(item, null, depth + 1, found));
    } else if (isRecord(value) || !containsRecord(value, depth)) {
      // Not a container of records: pass it on as-is so the validator can say what is missing.
      found.push({ record: value, concurrencyHint });
    } else {
      Object.keys(value).forEach((key) => {
        if (containsRecord(value[key], depth + 1)) collect(value[key], concurrencyFromKey(key), depth + 1, found);
      });
    }
    return found;
  }

  /**
   * @param {unknown} value  one parsed JSON value
   * @returns {Array<{ record: unknown, concurrencyHint: number|null }>}
   *   concurrencyHint comes from an object key like "c16", for records that do not state their own
   */
  function findRunRecords(value) {
    return collect(value, null, 0, []);
  }

  return { findRunRecords, concurrencyFromKey };
});
