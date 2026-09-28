/*
 * Reads a metric from a run, including the derived ones.
 * Relative metrics (scaling, speed retention) compare a run with the same model's lowest-concurrency run.
 */
BenchPanel.define('utils/metricValues', [], () => {
  'use strict';

  /** Approximate tokens per second one request sees: 1000 ms ÷ mean time per output token. */
  function tokensPerSecondFromTpot(tpotMs) {
    return typeof tpotMs === 'number' && tpotMs > 0 ? 1000 / tpotMs : null;
  }

  function successRate(run) {
    return run.numPrompts > 0 ? run.completed / run.numPrompts : null;
  }

  const DIRECT = {
    requestThroughput: (run) => run.requestThroughput,
    outputThroughput: (run) => run.outputThroughput,
    totalTokenThroughput: (run) => run.totalTokenThroughput,
    tokensPerRequest: (run) => tokensPerSecondFromTpot(run.tpot.mean),
    meanTtftMs: (run) => run.ttft.mean,
    p95TtftMs: (run) => run.ttft.p95,
    meanTpotMs: (run) => run.tpot.mean,
    p95TpotMs: (run) => run.tpot.p95,
    meanE2eMs: (run) => run.e2el.mean,
    p95E2eMs: (run) => run.e2el.p95,
    successRate,
  };

  function scalingEfficiency(run, baseline) {
    if (!baseline || run.concurrency === null || baseline.concurrency === null) return null;
    const ideal = baseline.outputThroughput * (run.concurrency / baseline.concurrency);
    return ideal > 0 ? run.outputThroughput / ideal : null;
  }

  function speedRetention(run, baseline) {
    const now = baseline && tokensPerSecondFromTpot(run.tpot.mean);
    const base = baseline && tokensPerSecondFromTpot(baseline.tpot.mean);
    return now && base ? now / base : null;
  }

  const RELATIVE = { scalingEfficiency, speedRetention };

  /**
   * @param {import('../types/benchmarkRun').BenchmarkRun|null|undefined} run
   * @param {string} key  a key of METRICS in constants/metricCatalog
   * @param {Object} [baseline]  the model's lowest-concurrency run, needed for relative metrics
   * @returns {number|null}
   */
  function getMetricValue(run, key, baseline) {
    if (!run) return null;
    if (key in DIRECT) {
      const value = DIRECT[key](run);
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }
    if (key in RELATIVE) return RELATIVE[key](run, baseline);
    throw new Error(`Unknown metric "${key}"`);
  }

  return { tokensPerSecondFromTpot, getMetricValue };
});
