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
    decodeTokensPerSecond: { label: 'Decode tok/s', title: 'Decode speed', better: HIGHER, format: 'fixed', decimals: 1, unit: 'tok/s',
      description: 'Speed of each request while it is generating tokens. Does not include TTFT or queue wait time.' },
    // Per user tok/s comes in two formulas; the user picks one (PER_USER_FORMULAS) and every view shows that one.
    perUserTokensPerSecondA: { label: 'Per user tok/s', title: 'Per user speed (option A)', better: HIGHER, format: 'fixed', decimals: 1, unit: 'tok/s',
      description: 'Total output TPS shared across all concurrent users. Includes TTFT and queue wait time.' },
    perUserTokensPerSecondB: { label: 'Per user tok/s', title: 'Per user speed (option B)', better: HIGHER, format: 'fixed', decimals: 1, unit: 'tok/s',
      description: 'Average output tokens per request divided by full request time. Includes TTFT and queue wait time.' },
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
    // exact: a failed request is never noise, so any gap in success rate counts.
    successRate: { label: 'Success', title: 'Success rate', better: HIGHER, format: 'percent', decimals: 1, exact: true,
      description: 'Completed requests out of requests sent.' },
    scalingEfficiency: { label: 'Scaling eff.', title: 'Throughput scaling efficiency', better: HIGHER, format: 'percent', decimals: 0,
      description: 'Output TPS at this level ÷ (concurrency × Output TPS at the lowest level). 100% is perfect scaling.' },
  });

  /**
   * Metrics a user can pick as the focus of the comparison view, in menu order, after Per user tok/s (which the view
   * adds first, in the formula the user picked). Req/s, Total TPS and TPOT are left out: with a fixed output length
   * they rank models exactly like Output TPS and Decode tok/s. They stay in Model detail.
   */
  const FOCUS_METRIC_KEYS = Object.freeze([
    'outputThroughput', 'decodeTokensPerSecond', 'meanTtftMs', 'p95TtftMs', 'meanE2eMs', 'p95E2eMs',
  ]);

  /** The two formulas Per user tok/s can use, in menu order; A is the default. */
  const PER_USER_FORMULAS = Object.freeze([
    { value: 'A', label: 'A: Output TPS ÷ concurrency', metricKey: 'perUserTokensPerSecondA' },
    { value: 'B', label: 'B: Tokens per request ÷ E2E time', metricKey: 'perUserTokensPerSecondB' },
  ]);

  /** Shown on a value where option A was asked for but the run has no max_concurrency, so option B was used. */
  const PER_USER_FALLBACK_NOTE = 'Option B was used: this run has no max_concurrency, which option A needs.';

  return { HIGHER, LOWER, METRICS, FOCUS_METRIC_KEYS, PER_USER_FORMULAS, PER_USER_FALLBACK_NOTE };
});
