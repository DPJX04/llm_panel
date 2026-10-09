(function () {
  'use strict';

  const perUserMetric = BenchPanel.require('utils/perUserMetric');
  const { run } = BenchPanelTests.fixtures;

  test('per user metric: each formula has its own metric; an unknown one falls back to option A', () => {
    assert.equal(perUserMetric.metricKeyFor('A'), 'perUserTokensPerSecondA');
    assert.equal(perUserMetric.metricKeyFor('B'), 'perUserTokensPerSecondB');
    assert.equal(perUserMetric.metricKeyFor('X'), 'perUserTokensPerSecondA');
  });

  test('per user metric: a note only where option A had to use option B', () => {
    const uncapped = run({ max_concurrency: null });
    assert.ok(/Option B was used/.test(perUserMetric.valueNote(uncapped, 'perUserTokensPerSecondA')));
    assert.equal(perUserMetric.valueNote(run({ max_concurrency: 8 }), 'perUserTokensPerSecondA'), null, 'option A worked');
    assert.equal(perUserMetric.valueNote(uncapped, 'perUserTokensPerSecondB'), null, 'option B was asked for');
    assert.equal(perUserMetric.valueNote(uncapped, 'outputThroughput'), null, 'another metric');
  });
})();
