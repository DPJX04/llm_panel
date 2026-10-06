(function () {
  'use strict';

  const sampleStats = BenchPanel.require('utils/sampleStats');

  test('stats: mean and percentile skip missing values', () => {
    assert.equal(sampleStats.mean([1, null, 3]), 2);
    assert.equal(sampleStats.mean([null]), null);
    assert.equal(sampleStats.percentile([10, 20, 30, 40, 50], 0.5), 30);
    assert.near(sampleStats.percentile([1, 2, 3, 4], 0.95), 3.85, 1e-9);
    assert.equal(sampleStats.percentile([], 0.95), null);
  });
})();
