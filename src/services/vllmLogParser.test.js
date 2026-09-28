(function () {
  'use strict';

  const vllmLogParser = BenchPanel.require('services/vllmLogParser');

  // Startup lines as vLLM 0.10 (V1 engine) prints them, single GPU.
  const SINGLE_GPU_LOG = [
    'INFO 09-23 15:01:02 [api_server.py:1805] vLLM API server version 0.10.1',
    "INFO 09-23 15:01:02 [utils.py:326] non-default args: {'model': 'Qwen/Qwen3-4B-Instruct-2507', 'max_model_len': 32768}",
    "INFO 09-23 15:01:10 [core.py:74] Initializing a V1 LLM engine (v0.10.1) with config: model='Qwen/Qwen3-4B-Instruct-2507', speculative_config=None, tokenizer='Qwen/Qwen3-4B-Instruct-2507', max_seq_len=32768, tensor_parallel_size=1, pipeline_parallel_size=1",
    'INFO 09-23 15:01:20 [gpu_model_runner.py:1953] Model loading took 7.6334 GiB and 5.912 seconds',
    'INFO 09-23 15:01:30 [gpu_worker.py:276] Available KV cache memory: 12.34 GiB',
    'INFO 09-23 15:01:30 [kv_cache_utils.py:849] GPU KV cache size: 89,856 tokens',
    'INFO 09-23 15:01:30 [kv_cache_utils.py:853] Maximum concurrency for 32,768 tokens per request: 2.74x',
    'INFO 09-23 15:05:00 [loggers.py:122] Engine 000: Avg prompt throughput: 120.3 tokens/s, GPU KV cache usage: 3.1%',
  ].join('\n');

  test('log: reads model, weights and KV cache from a single-GPU startup', () => {
    const parsed = vllmLogParser.parseVllmLog(SINGLE_GPU_LOG);
    assert.ok(parsed.ok, parsed.error);
    assert.deepEqual(parsed.data, {
      modelId: 'Qwen/Qwen3-4B-Instruct-2507',
      tensorParallelSize: 1,
      modelSizeGb: 7.6334,
      gpuMemoryTotalGb: null,
      kvCache: { memoryGb: 12.34, sizeTokens: 89856, maxModelLen: 32768, maxConcurrency: 2.74 },
    });
  });

  test('log: per-GPU amounts are summed across tensor-parallel ranks', () => {
    const log = [
      "INFO Initializing a V1 LLM engine with config: model='org/big-model', max_seq_len=8192, tensor_parallel_size=2",
      '(VllmWorker rank=0 pid=11) INFO Model loading took 9.10 GiB and 12.0 seconds',
      '(VllmWorker rank=1 pid=12) INFO Model loading took 9.10 GiB and 12.1 seconds',
      '(VllmWorker rank=0 pid=11) INFO Available KV cache memory: 10.50 GiB',
      '(VllmWorker rank=1 pid=12) INFO Available KV cache memory: 10.50 GiB',
      'INFO GPU KV cache size: 171,984 tokens',
      'INFO Maximum concurrency for 8,192 tokens per request: 20.99x',
    ].join('\n');
    const parsed = vllmLogParser.parseVllmLog(log);
    assert.equal(parsed.data.tensorParallelSize, 2);
    assert.near(parsed.data.modelSizeGb, 18.2);
    assert.near(parsed.data.kvCache.memoryGb, 21);
    assert.equal(parsed.data.kvCache.maxModelLen, 8192);
  });

  test('log: older vLLM wording for KV cache memory and GPU capacity', () => {
    const log = 'INFO Memory profiling takes 3.2 seconds. the current vLLM instance can use total_gpu_memory (23.57GiB) x gpu_memory_utilization (0.90) = 21.21GiB; model weights take 7.63GiB; non_torch_memory takes 0.08GiB; PyTorch activation peak memory takes 1.40GiB; the rest of the memory reserved for KV Cache is 12.10GiB.';
    const parsed = vllmLogParser.parseVllmLog(log);
    assert.ok(parsed.ok, parsed.error);
    assert.equal(parsed.data.gpuMemoryTotalGb, 23.57);
    assert.equal(parsed.data.kvCache.memoryGb, 12.1);
  });

  test('log: text without any memory lines is rejected', () => {
    assert.equal(vllmLogParser.parseVllmLog('hello\nworld').ok, false);
  });
})();
