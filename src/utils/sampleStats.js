/* Averages and percentiles over values that may be missing. */
BenchPanel.define('utils/sampleStats', [], () => {
  'use strict';

  function present(values) {
    return values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  }

  /** @param {Array<number|null>} values */
  function mean(values) {
    const numbers = present(values);
    return numbers.length > 0 ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null;
  }

  /** Linear interpolation between the closest ranks. @param {number} share 0..1, e.g. 0.95 for P95 */
  function percentile(values, share) {
    const numbers = present(values).sort((a, b) => a - b);
    if (numbers.length === 0) return null;
    const position = (numbers.length - 1) * share;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return numbers[lower] + (numbers[upper] - numbers[lower]) * (position - lower);
  }

  return { mean, percentile };
});
