/*
 * Labels and units of the hardware numbers a user enters per model.
 * GPU rows follow the usual monitoring layout: one metric per row, one GPU per column.
 */
BenchPanel.define('constants/hardwareFields', [], () => {
  'use strict';

  const GPU_USAGE_ROWS = Object.freeze([
    { field: 'gpuUtilPct', label: 'Average GPU utilization', shortLabel: 'GPU util', unit: '%', decimals: 1, max: 100, combine: 'average' },
    { field: 'memoryUsedGb', label: 'Average memory used', shortLabel: 'Memory used', unit: 'GB', decimals: 2, combine: 'sum' },
    { field: 'memoryUtilPct', label: 'Average memory utilization', shortLabel: 'Memory util', unit: '%', decimals: 1, max: 100, combine: 'average',
      help: 'As your monitoring tool reports it. Note: nvidia-smi "memory utilization" is how busy memory bandwidth was, not how much space is used.' },
    { field: 'powerW', label: 'Average power', shortLabel: 'Power', unit: 'W', decimals: 1, combine: 'sum' },
    { field: 'temperatureC', label: 'Average temperature', shortLabel: 'Temperature', unit: '°C', decimals: 1, combine: 'hottest' },
  ]);

  const KV_CACHE_ROWS = Object.freeze([
    { field: 'memoryGb', label: 'KV cache memory', unit: 'GB', decimals: 2,
      help: '"Available KV cache memory" in the vLLM startup log, summed across GPUs.' },
    { field: 'sizeTokens', label: 'KV cache size', unit: 'tokens', decimals: 0,
      help: '"GPU KV cache size: N tokens" in the vLLM startup log.' },
    { field: 'maxModelLen', label: 'Max model length', unit: 'tokens', decimals: 0,
      help: 'The longest request the server accepts (--max-model-len).' },
    { field: 'maxConcurrency', label: 'Max concurrency at max length', unit: '×', decimals: 2,
      help: '"Maximum concurrency for N tokens per request: Nx": how many full-length requests fit in the KV cache at once.' },
  ]);

  return { GPU_USAGE_ROWS, KV_CACHE_ROWS };
});
