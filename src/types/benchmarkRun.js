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
 * @property {Object} raw                the original record's plain fields, kept so exports are lossless
 *
 * Memory values are in GB as vLLM and nvidia-smi report them (binary GB, i.e. GiB).
 *
 * @typedef {Object} GpuUsage             averages over a benchmark, for one GPU
 * @property {number|null} gpuUtilPct
 * @property {number|null} memoryUsedGb
 * @property {number|null} memoryUtilPct  as the monitoring tool reports it
 * @property {number|null} powerW
 * @property {number|null} temperatureC
 *
 * @typedef {Object} KvCacheStats         from the vLLM server startup log
 * @property {number|null} memoryGb       KV cache memory across all GPUs
 * @property {number|null} sizeTokens     "GPU KV cache size: N tokens"
 * @property {number|null} maxModelLen
 * @property {number|null} maxConcurrency "Maximum concurrency for <max-model-len> tokens per request: Nx"
 *
 * @typedef {Object} ModelProfile
 * @property {string} shortName           empty means "use the generated short name"
 * @property {number|null} modelSizeGb    model weights in GPU memory, across all GPUs
 * @property {number|null} gpuMemoryTotalGb  capacity of one GPU
 * @property {GpuUsage[]} gpus            one entry per GPU the model runs on
 * @property {KvCacheStats} kvCache
 */
BenchPanel.define('types/benchmarkRun', [], () => {
  'use strict';

  const LATENCY_STAT_KEYS = Object.freeze(['mean', 'median', 'std', 'p50', 'p90', 'p95', 'p99']);
  const LATENCY_METRICS = Object.freeze(['ttft', 'tpot', 'itl', 'e2el']);
  const GPU_USAGE_FIELDS = Object.freeze(['gpuUtilPct', 'memoryUsedGb', 'memoryUtilPct', 'powerW', 'temperatureC']);
  const KV_CACHE_FIELDS = Object.freeze(['memoryGb', 'sizeTokens', 'maxModelLen', 'maxConcurrency']);
  const MAX_GPUS = 16;

  /** @returns {GpuUsage} */
  function createGpuUsage() {
    return { gpuUtilPct: null, memoryUsedGb: null, memoryUtilPct: null, powerW: null, temperatureC: null };
  }

  /** @returns {KvCacheStats} */
  function createKvCacheStats() {
    return { memoryGb: null, sizeTokens: null, maxModelLen: null, maxConcurrency: null };
  }

  /** @returns {ModelProfile} */
  function createModelProfile() {
    return { shortName: '', modelSizeGb: null, gpuMemoryTotalGb: null, gpus: [createGpuUsage()], kvCache: createKvCacheStats() };
  }

  return {
    LATENCY_STAT_KEYS, LATENCY_METRICS, GPU_USAGE_FIELDS, KV_CACHE_FIELDS, MAX_GPUS,
    createGpuUsage, createKvCacheStats, createModelProfile,
  };
});
