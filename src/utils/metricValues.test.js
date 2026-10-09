(function () {
  'use strict';

  const metricValues = BenchPanel.require('utils/metricValues');
  const { METRICS } = BenchPanel.require('constants/metricCatalog');
  const numberFormat = BenchPanel.require('utils/numberFormat');
  const { run } = BenchPanelTests.fixtures;

  /** The value as the tables show it: rounded to the metric's decimals, with its unit. */
  function shown(sample, key) {
    return numberFormat.formatMetric(metricValues.getMetricValue(sample, key), METRICS[key]);
  }

  test('decode tok/s is 1000 ÷ TPOT', () => {
    assert.near(metricValues.tokensPerSecondFromTpot(25), 40);
    assert.near(metricValues.tokensPerSecondFromTpot(45.2), 22.124, 0.001);
    assert.equal(metricValues.tokensPerSecondFromTpot(0), null, 'zero TPOT');
    assert.equal(metricValues.tokensPerSecondFromTpot(null), null, 'missing TPOT');
  });

  test('decode tok/s check: mean TPOT 17.9 ms gives 55.9', () => {
    assert.equal(shown(run({ mean_tpot_ms: 17.9 }), 'decodeTokensPerSecond'), '55.9 tok/s');
  });

  test('per user tok/s option A check: output TPS 205.9 shared by 8 users gives 25.7', () => {
    const sample = run({ output_throughput: 205.9, max_concurrency: 8 });
    assert.near(metricValues.getMetricValue(sample, 'perUserTokensPerSecondA'), 25.7375, 1e-9);
    assert.equal(shown(sample, 'perUserTokensPerSecondA'), '25.7 tok/s');
  });

  test('per user tok/s option B check: 256 tokens per request over 9.82 s gives 26.1', () => {
    const sample = run({ completed: 160, total_output_tokens: 256 * 160, mean_e2el_ms: 9820 });
    assert.near(metricValues.getMetricValue(sample, 'perUserTokensPerSecondB'), 256 / 9.82, 1e-9);
    assert.equal(shown(sample, 'perUserTokensPerSecondB'), '26.1 tok/s');
  });

  test('per user tok/s option A falls back to option B when the run has no max_concurrency', () => {
    const uncapped = run({ max_concurrency: null, completed: 160, total_output_tokens: 256 * 160, mean_e2el_ms: 9820 });
    assert.ok(metricValues.perUserFallsBackToE2e(uncapped));
    assert.equal(metricValues.getMetricValue(uncapped, 'perUserTokensPerSecondA'), metricValues.getMetricValue(uncapped, 'perUserTokensPerSecondB'));
    assert.ok(!metricValues.perUserFallsBackToE2e(run({ max_concurrency: 8 })));
  });

  test('tok/s metrics show a dash when a field they need is missing or zero', () => {
    assert.equal(shown(run({ mean_tpot_ms: 0 }), 'decodeTokensPerSecond'), numberFormat.MISSING, 'zero TPOT');
    assert.equal(shown(run({ output_throughput: 0 }), 'perUserTokensPerSecondA'), numberFormat.MISSING, 'zero output TPS');
    assert.equal(shown(run({ total_output_tokens: null }), 'perUserTokensPerSecondB'), numberFormat.MISSING, 'missing output tokens');
    assert.equal(shown(run({ completed: 0, failed: 160 }), 'perUserTokensPerSecondB'), numberFormat.MISSING, 'nothing completed');
    assert.equal(shown(run({ mean_e2el_ms: 0 }), 'perUserTokensPerSecondB'), numberFormat.MISSING, 'zero E2E');
  });

  test('direct metrics map to the right fields', () => {
    const sample = run();
    assert.equal(metricValues.getMetricValue(sample, 'outputThroughput'), 282.7096);
    assert.equal(metricValues.getMetricValue(sample, 'meanTtftMs'), 49.347);
    assert.equal(metricValues.getMetricValue(sample, 'p95E2eMs'), 3678.819);
    assert.equal(metricValues.getMetricValue(null, 'outputThroughput'), null, 'no run');
  });

  test('success rate is completed ÷ prompts', () => {
    assert.near(metricValues.getMetricValue(run({ completed: 150, failed: 10, num_prompts: 160 }), 'successRate'), 0.9375);
  });

  test('scaling efficiency compares with ideal linear scaling from the baseline', () => {
    const baseline = run({ max_concurrency: 1, output_throughput: 40 });
    const loaded = run({ max_concurrency: 4, output_throughput: 120 });
    assert.near(metricValues.getMetricValue(loaded, 'scalingEfficiency', baseline), 0.75);
    assert.near(metricValues.getMetricValue(baseline, 'scalingEfficiency', baseline), 1);
    assert.equal(metricValues.getMetricValue(loaded, 'scalingEfficiency'), null, 'no baseline');
  });

  test('an unknown metric key is an error, not a silent blank', () => {
    assert.throws(() => metricValues.getMetricValue(run(), 'nope'), /Unknown metric/);
  });
})();
