(function () {
  'use strict';

  const chartScale = BenchPanel.require('utils/chartScale');

  test('ticks: round steps from zero that cover the maximum', () => {
    assert.deepEqual(chartScale.niceTicks(324.4, 4), [0, 100, 200, 300, 400]);
    assert.deepEqual(chartScale.niceTicks(43.3, 4), [0, 20, 40, 60]);
    assert.deepEqual(chartScale.niceTicks(0.9, 4), [0, 0.25, 0.5, 0.75, 1]);
  });

  test('ticks: an empty range still gives an axis', () => {
    assert.deepEqual(chartScale.niceTicks(0, 4), [0, 1]);
  });
})();
