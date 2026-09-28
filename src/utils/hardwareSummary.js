/*
 * Turns a model's hardware profile into the numbers the tables show: GPU totals across all GPUs,
 * where the GPU memory went (weights, KV cache, the rest, free), and throughput per GB and per joule.
 */
BenchPanel.define('utils/hardwareSummary', [], () => {
  'use strict';

  function present(values) {
    return values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  }

  function sum(values) {
    const found = present(values);
    return found.length > 0 ? found.reduce((total, value) => total + value, 0) : null;
  }

  function mean(values) {
    const found = present(values);
    return found.length > 0 ? sum(found) / found.length : null;
  }

  function max(values) {
    const found = present(values);
    return found.length > 0 ? Math.max(...found) : null;
  }

  function ratio(numerator, denominator) {
    return typeof numerator === 'number' && typeof denominator === 'number' && denominator > 0 ? numerator / denominator : null;
  }

  /**
   * Utilisation and memory-utilisation are averaged across GPUs; memory and power are summed;
   * temperature is the hottest GPU.
   * @param {import('../types/benchmarkRun').ModelProfile} profile
   */
  function summarizeGpus(profile) {
    const pick = (field) => profile.gpus.map((gpu) => gpu[field]);
    const memoryUsedGb = sum(pick('memoryUsedGb'));
    const capacityGb = profile.gpuMemoryTotalGb ? profile.gpuMemoryTotalGb * profile.gpus.length : null;
    return {
      gpuCount: profile.gpus.length,
      gpuUtilPct: mean(pick('gpuUtilPct')),
      memoryUsedGb,
      memoryUtilPct: mean(pick('memoryUtilPct')),
      powerW: sum(pick('powerW')),
      temperatureC: max(pick('temperatureC')),
      capacityGb,
      occupancy: ratio(memoryUsedGb, capacityGb),
    };
  }

  /**
   * Where the GPU memory went. "Other" is activations, CUDA graphs and runtime overhead:
   * memory used minus weights minus KV cache. When weights or KV cache are unknown, the used memory
   * that cannot be attributed is "unattributed" instead, so the bar still adds up to memory used.
   */
  function memoryBreakdown(profile) {
    const { memoryUsedGb: usedGb, capacityGb } = summarizeGpus(profile);
    const weightsGb = profile.modelSizeGb;
    const kvCacheGb = profile.kvCache.memoryGb;
    const known = present([weightsGb, kvCacheGb]);
    const rest = usedGb === null ? null : Math.max(0, usedGb - known.reduce((total, value) => total + value, 0));
    const otherGb = known.length === 2 ? rest : null;
    const unattributedGb = known.length < 2 ? rest : null;
    const freeGb = usedGb !== null && capacityGb !== null ? Math.max(0, capacityGb - usedGb) : null;
    return { weightsGb, kvCacheGb, otherGb, unattributedGb, freeGb, usedGb, capacityGb };
  }

  /** @param {number|null} outputTps  output tokens per second at the level being compared */
  function memoryEfficiency(profile, outputTps) {
    const { memoryUsedGb, powerW } = summarizeGpus(profile);
    return {
      tpsPerGb: ratio(outputTps, memoryUsedGb),
      tokensPerJoule: ratio(outputTps, powerW),
      kvTokensPerGb: ratio(profile.kvCache.sizeTokens, profile.kvCache.memoryGb),
      kvShare: ratio(profile.kvCache.memoryGb, memoryUsedGb),
      weightsShare: ratio(profile.modelSizeGb, memoryUsedGb),
    };
  }

  function hasGpuUsage(profile) {
    return profile.gpus.some((gpu) => Object.values(gpu).some((value) => value !== null));
  }

  function hasKvCache(profile) {
    return Object.values(profile.kvCache).some((value) => value !== null);
  }

  function hasMemoryData(profile) {
    return profile.modelSizeGb !== null || profile.kvCache.memoryGb !== null || summarizeGpus(profile).memoryUsedGb !== null;
  }

  return { summarizeGpus, memoryBreakdown, memoryEfficiency, hasGpuUsage, hasKvCache, hasMemoryData };
});
