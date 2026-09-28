/**
 * Shared domain shapes: one benchmark run, and the hardware profile a user adds per model.
 *
 * @typedef {{ mean: number|null, median: number|null, std: number|null,
 *             p50: number|null, p90: number|null, p95: number|null, p99: number|null }} LatencyStats
 *
 * @typedef {Object} BenchmarkRun
 * @property {string} id                 unique per model, concurrency and run date
 * @property {string} modelKey           groups runs of one model (model id plus label)
 * @property {string} modelId
 * @property {string|null} label
 * @property {number|null} concurrency   null when the run had no concurrency cap
 * @property {string} date
 * @property {string} sourceFile
 * @property {number} numPrompts
 * @property {number} completed
 * @property {number} failed
 * @property {number|null} durationS
 * @property {number|null} totalInputTokens
 * @property {number|null} totalOutputTokens
 * @property {number} requestThroughput
 * @property {number} outputThroughput
 * @property {number|null} totalTokenThroughput
 * @property {number|null} peakOutputTokensPerS
 * @property {LatencyStats} ttft
 * @property {LatencyStats} tpot
 * @property {LatencyStats} itl
 * @property {LatencyStats} e2el
 * @property {Object} raw                the original record, kept so exports are lossless
 *
 * @typedef {Object} ModelProfile
 * @property {string} shortName          empty means "use the generated short name"
 * @property {number|null} modelSizeGb
 * @property {number|null} vramGb
 * @property {number|null} gpuUtilPct
 * @property {number|null} powerW
 */
BenchPanel.define('types/benchmarkRun', [], () => {
  'use strict';

  const LATENCY_STAT_KEYS = Object.freeze(['mean', 'median', 'std', 'p50', 'p90', 'p95', 'p99']);
  const LATENCY_METRICS = Object.freeze(['ttft', 'tpot', 'itl', 'e2el']);
  const PROFILE_NUMBER_FIELDS = Object.freeze(['modelSizeGb', 'vramGb', 'gpuUtilPct', 'powerW']);

  /** @returns {ModelProfile} */
  function createModelProfile() {
    return { shortName: '', modelSizeGb: null, vramGb: null, gpuUtilPct: null, powerW: null };
  }

  return { LATENCY_STAT_KEYS, LATENCY_METRICS, PROFILE_NUMBER_FIELDS, createModelProfile };
});
