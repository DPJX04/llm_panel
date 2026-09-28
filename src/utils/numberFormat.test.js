(function () {
  'use strict';

  const numberFormat = BenchPanel.require('utils/numberFormat');
  const { METRICS } = BenchPanel.require('constants/metricCatalog');

  test('format: each metric uses its unit and precision', () => {
    assert.equal(numberFormat.formatMetric(5960, METRICS.meanE2eMs), '5.96 s');
    assert.equal(numberFormat.formatMetric(395.4, METRICS.meanTtftMs), '395 ms');
    assert.equal(numberFormat.formatMetric(25.04, METRICS.meanTpotMs), '25.0 ms');
    assert.equal(numberFormat.formatMetric(1234.56, METRICS.outputThroughput), '1,234.6');
    assert.equal(numberFormat.formatMetric(0.9875, METRICS.successRate), '98.8%');
    assert.equal(numberFormat.formatMetric(43.3, METRICS.tokensPerRequest), '43.3 tok/s');
  });

  test('format: missing values show a dash', () => {
    assert.equal(numberFormat.formatMetric(null, METRICS.meanTtftMs), '—');
    assert.equal(numberFormat.formatMetric(NaN, METRICS.meanTtftMs), '—');
  });

  test('format: ratio deltas are signed', () => {
    assert.equal(numberFormat.formatRatioDelta(1.042), '+4.2%');
    assert.equal(numberFormat.formatRatioDelta(0.97), '−3.0%');
  });

  test('format: axis ticks keep only the digits they need', () => {
    assert.equal(numberFormat.formatTick(300, METRICS.outputThroughput), '300');
    assert.equal(numberFormat.formatTick(2.5, METRICS.outputThroughput), '2.5');
    assert.equal(numberFormat.formatTick(2000, METRICS.meanE2eMs), '2 s');
    assert.equal(numberFormat.formatTick(0.25, METRICS.successRate), '25%');
  });

  test('format: vLLM run dates and uncapped concurrency', () => {
    assert.equal(numberFormat.formatRunDate('20260923-151902'), '2026-09-23 15:19');
    assert.equal(numberFormat.formatConcurrency(null), 'Uncapped');
    assert.equal(numberFormat.formatConcurrency(16), '16');
  });
})();
