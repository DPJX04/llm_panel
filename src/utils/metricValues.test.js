(function () {
  'use strict';

  const metricValues = BenchPanel.require('utils/metricValues');
  const { run } = BenchPanelTests.fixtures;

  test('tokens/s per request is 1000 ÷ TPOT', () => {
    assert.near(metricValues.tokensPerSecondFromTpot(25), 40);
    assert.near(metricValues.tokensPerSecondFromTpot(45.2), 22.124, 0.001);
    assert.equal(metricValues.tokensPerSecondFromTpot(0), null, 'zero TPOT');
    assert.equal(metricValues.tokensPerSecondFromTpot(null), null, 'missing TPOT');
  });

  test('tokens/s per request is read from the run\'s mean TPOT', () => {
    assert.near(metricValues.getMetricValue(run({ mean_tpot_ms: 14.008 }), 'tokensPerRequest'), 71.388, 0.001);
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

  test('speed retention is per-request speed relative to the baseline', () => {
    const baseline = run({ max_concurrency: 1, mean_tpot_ms: 25 });
    const loaded = run({ max_concurrency: 16, mean_tpot_ms: 50 });
    assert.near(metricValues.getMetricValue(loaded, 'speedRetention', baseline), 0.5);
  });

  test('an unknown metric key is an error, not a silent blank', () => {
    assert.throws(() => metricValues.getMetricValue(run(), 'nope'), /Unknown metric/);
  });
})();
