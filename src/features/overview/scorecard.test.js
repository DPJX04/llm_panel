(function () {
  'use strict';

  const scorecard = BenchPanel.require('features/overview/scorecard');
  const { run } = BenchPanelTests.fixtures;

  function model(key, colorSlot) {
    return { key, modelId: key, label: null, name: key, colorSlot, profile: {} };
  }

  test('scorecard: averages ranks across criteria and orders by the average', () => {
    // "fast" wins throughput and per-user speed; "snappy" wins every latency criterion.
    const runs = [
      run({ model_id: 'fast', max_concurrency: 1, mean_tpot_ms: 20, mean_ttft_ms: 300 }),
      run({ model_id: 'fast', max_concurrency: 16, output_throughput: 320, mean_ttft_ms: 600, mean_e2el_ms: 9000 }),
      run({ model_id: 'snappy', max_concurrency: 1, mean_tpot_ms: 25, mean_ttft_ms: 200 }),
      run({ model_id: 'snappy', max_concurrency: 16, output_throughput: 300, mean_ttft_ms: 500, mean_e2el_ms: 8000 }),
    ];
    const card = scorecard.buildScorecard([model('fast', 1), model('snappy', 2)], runs, { low: 1, peak: 16 });
    assert.equal(card.criteria.length, 5);
    const byName = Object.fromEntries(card.rows.map((row) => [row.model.key, row]));
    assert.deepEqual(byName.fast.cells.map((cell) => cell.rank), [1, 1, 2, 2, 2]);
    assert.near(byName.fast.averageRank, 1.6);
    assert.near(byName.snappy.averageRank, 1.4);
    assert.equal(card.rows[0].model.key, 'snappy');
    assert.equal(card.rows[0].overallRank, 1);
  });

  test('scorecard: one tested level does not count the same criterion twice', () => {
    const card = scorecard.buildScorecard([model('only', 1)], [run({ model_id: 'only', max_concurrency: 4 })], { low: 4, peak: 4 });
    assert.equal(card.criteria.length, 4);
  });
})();
