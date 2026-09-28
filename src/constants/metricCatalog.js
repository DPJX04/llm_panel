/*
 * Every metric the panel can show: its label, unit, display format, and which direction is better.
 * Formats: 'fixed' (plain number), 'ms', 'seconds' (value stored in ms, shown in s), 'percent' (0..1).
 */
BenchPanel.define('constants/metricCatalog', [], () => {
  'use strict';

  const HIGHER = 'higher';
  const LOWER = 'lower';

  const METRICS = Object.freeze({
    requestThroughput: { label: 'Req/s', title: 'Requests per second', better: HIGHER, format: 'fixed', decimals: 3,
      description: 'Completed requests per second across all users.' },
    outputThroughput: { label: 'Output TPS', title: 'Output tokens per second', better: HIGHER, format: 'fixed', decimals: 1,
      description: 'Generated tokens per second across all concurrent requests. The main capacity number.' },
    totalTokenThroughput: { label: 'Total TPS', title: 'Total tokens per second', better: HIGHER, format: 'fixed', decimals: 1,
      description: 'Prompt plus generated tokens processed per second.' },
    tokensPerRequest: { label: 'Tok/s per request', title: 'Token speed per request', better: HIGHER, format: 'fixed', decimals: 1,
      unit: 'tok/s', description: 'How fast one user sees text appear. Approximated as 1000 ÷ mean TPOT (ms).' },
    meanTtftMs: { label: 'Mean TTFT', title: 'Mean time to first token', better: LOWER, format: 'ms', decimals: 0,
      description: 'Wait before the first word appears.' },
    p95TtftMs: { label: 'P95 TTFT', title: 'P95 time to first token', better: LOWER, format: 'ms', decimals: 0,
      description: '95% of requests saw their first token within this time.' },
    meanTpotMs: { label: 'Mean TPOT', title: 'Mean time per output token', better: LOWER, format: 'ms', decimals: 1,
      description: 'Average gap between generated tokens, after the first one.' },
    p95TpotMs: { label: 'P95 TPOT', title: 'P95 time per output token', better: LOWER, format: 'ms', decimals: 1,
      description: 'Time per output token for the slowest 5% of requests.' },
    meanE2eMs: { label: 'Mean E2E', title: 'Mean end-to-end latency', better: LOWER, format: 'seconds', decimals: 2,
      description: 'Total time from sending a request to receiving the full answer.' },
    p95E2eMs: { label: 'P95 E2E', title: 'P95 end-to-end latency', better: LOWER, format: 'seconds', decimals: 2,
      description: '95% of requests finished within this time.' },
    successRate: { label: 'Success', title: 'Success rate', better: HIGHER, format: 'percent', decimals: 1,
      description: 'Completed requests out of requests sent.' },
    scalingEfficiency: { label: 'Scaling eff.', title: 'Throughput scaling efficiency', better: HIGHER, format: 'percent', decimals: 0,
      description: 'Output TPS at this level ÷ (concurrency × Output TPS at the lowest level). 100% is perfect scaling.' },
    speedRetention: { label: 'Speed kept', title: 'Per-request speed retained', better: HIGHER, format: 'percent', decimals: 0,
      description: 'Tok/s per request at this level ÷ tok/s per request at the lowest level.' },
  });

  /** Metrics a user can pick as the focus of the comparison view, in menu order. */
  const FOCUS_METRIC_KEYS = Object.freeze([
    'outputThroughput', 'tokensPerRequest', 'requestThroughput', 'totalTokenThroughput',
    'meanTtftMs', 'p95TtftMs', 'meanTpotMs', 'meanE2eMs', 'p95E2eMs',
  ]);

  return { HIGHER, LOWER, METRICS, FOCUS_METRIC_KEYS };
});
