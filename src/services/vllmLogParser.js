/*
 * Reads memory and KV cache facts from a `vllm serve` log: model weights, KV cache memory and size,
 * max model length, max concurrency, tensor-parallel size and GPU capacity.
 * Log wording differs between vLLM versions, so every fact is optional; unknown lines are ignored.
 */
BenchPanel.define('services/vllmLogParser', ['types/result'], (result) => {
  'use strict';

  function toNumber(text) {
    const value = Number(String(text).replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  function firstMatch(text, patterns) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) return match;
    }
    return null;
  }

  function lastMatch(text, pattern) {
    const matches = Array.from(text.matchAll(new RegExp(pattern.source, 'g')));
    return matches.length > 0 ? matches[matches.length - 1] : null;
  }

  /**
   * A per-GPU amount, summed across tensor-parallel ranks. Each rank logs its own line,
   * tagged "rank=N"; a rank that logs twice counts once (its last value).
   */
  function sumAcrossRanks(lines, pattern) {
    const byRank = new Map();
    lines.forEach((line) => {
      const match = pattern.exec(line);
      if (!match) return;
      const rank = /rank=(\d+)/.exec(line);
      byRank.set(rank ? rank[1] : 'single', toNumber(match[1]));
    });
    if (byRank.size === 0) return null;
    return Array.from(byRank.values()).reduce((total, value) => total + value, 0);
  }

  /**
   * @param {string} text
   * @returns {import('../types/result').Result<{
   *   modelId: string|null, tensorParallelSize: number|null, modelSizeGb: number|null, gpuMemoryTotalGb: number|null,
   *   kvCache: { memoryGb: number|null, sizeTokens: number|null, maxModelLen: number|null, maxConcurrency: number|null } }>}
   */
  function parseVllmLog(text) {
    const lines = text.split(/\r?\n/);
    const model = firstMatch(text, [/\bmodel='([^']+)'/, /'model':\s*'([^']+)'/, /"model":\s*"([^"]+)"/]);
    const tensorParallel = firstMatch(text, [/tensor_parallel_size=(\d+)/, /'tensor_parallel_size':\s*(\d+)/]);
    const maxSeqLen = firstMatch(text, [/max_seq_len=(\d+)/, /'max_model_len':\s*(\d+)/, /max_model_len=(\d+)/]);
    const concurrency = lastMatch(text, /Maximum concurrency for ([\d,]+) tokens per request:\s*([\d.,]+)x/);
    const kvTokens = lastMatch(text, /GPU KV cache size:\s*([\d,]+) tokens/);
    const gpuTotal = firstMatch(text, [/total_gpu_memory \(([\d.]+)\s*GiB\)/, /total GPU memory:?\s*([\d.]+)\s*GiB/i]);

    const weights = sumAcrossRanks(lines, /Model loading took ([\d.]+)\s*GiB/);
    const kvMemory = sumAcrossRanks(lines, /Available KV cache memory:\s*([\d.]+)\s*GiB/)
      ?? sumAcrossRanks(lines, /reserved for KV Cache is ([\d.]+)\s*GiB/);

    const stats = {
      modelId: model ? model[1] : null,
      tensorParallelSize: tensorParallel ? toNumber(tensorParallel[1]) : null,
      modelSizeGb: weights,
      gpuMemoryTotalGb: gpuTotal ? toNumber(gpuTotal[1]) : null,
      kvCache: {
        memoryGb: kvMemory,
        sizeTokens: kvTokens ? toNumber(kvTokens[1]) : null,
        maxModelLen: maxSeqLen ? toNumber(maxSeqLen[1]) : concurrency ? toNumber(concurrency[1]) : null,
        maxConcurrency: concurrency ? toNumber(concurrency[2]) : null,
      },
    };

    const found = [stats.modelSizeGb, stats.kvCache.memoryGb, stats.kvCache.sizeTokens, stats.kvCache.maxConcurrency];
    if (found.every((value) => value === null)) {
      return result.fail('No model memory or KV cache lines found. Is this the log of `vllm serve`, from startup?');
    }
    return result.ok(stats);
  }

  return { parseVllmLog };
});
