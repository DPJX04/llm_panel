/**
 * The one error shape. Every service returns a Result instead of throwing.
 * @template T
 * @typedef {{ ok: true, data: T } | { ok: false, error: string }} Result
 */
BenchPanel.define('types/result', [], () => {
  'use strict';

  /** @template T @param {T} data @returns {Result<T>} */
  function ok(data) {
    return { ok: true, data };
  }

  /** @param {string} error @returns {Result<never>} */
  function fail(error) {
    return { ok: false, error };
  }

  return { ok, fail };
});
