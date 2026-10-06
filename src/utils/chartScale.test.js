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

  test('range ticks: cover the values without starting at zero, so close recalls stay apart', () => {
    assert.deepEqual(chartScale.rangeTicks(0.981, 0.9961, 4), [0.98, 0.985, 0.99, 0.995, 1]);
    assert.deepEqual(chartScale.rangeTicks(120, 480, 4), [100, 200, 300, 400, 500]);
  });

  test('range ticks: one value still gets an axis around it', () => {
    const ticks = chartScale.rangeTicks(0.9952, 0.9952, 4);
    assert.ok(ticks.length >= 2 && ticks[0] <= 0.9952 && ticks[ticks.length - 1] >= 0.9952, JSON.stringify(ticks));
  });
})();
