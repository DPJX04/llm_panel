(function () {
  'use strict';

  const scorecard = BenchPanel.require('features/overview/scorecard');
  const { run } = BenchPanelTests.fixtures;

  function model(key, colorSlot) {
    return { key, modelId: key, label: null, name: key, colorSlot, profile: {} };
  }

  test('scorecard: each value scores as a share of the best, and the average orders the models', () => {
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
    assert.deepEqual(byName.fast.cells.map((cell) => Math.round(cell.score * 1000) / 10), [100, 100, 66.7, 83.3, 88.9]);
    assert.near(byName.fast.score, 0.87778, 0.0001);
    assert.near(byName.snappy.score, 0.9475, 0.0001);
    assert.equal(card.rows[0].model.key, 'snappy');
    assert.equal(card.rows[0].rank, 1);
    assert.equal(card.rows[1].rank, 2);
  });

  test('scorecard: models within 3% share a rank', () => {
    const runs = [
      run({ model_id: 'a', max_concurrency: 16, output_throughput: 297.9 }),
      run({ model_id: 'b', max_concurrency: 16, output_throughput: 297.7 }),
    ];
    const card = scorecard.buildScorecard([model('a', 1), model('b', 2)], runs, { low: 16, peak: 16 });
    assert.deepEqual(card.rows.map((row) => [row.rank, row.tied]), [[1, true], [1, true]]);
  });

  test('scorecard: one tested level does not count the same criterion twice', () => {
    const card = scorecard.buildScorecard([model('only', 1)], [run({ model_id: 'only', max_concurrency: 4 })], { low: 4, peak: 4 });
    assert.equal(card.criteria.length, 4);
  });
})();
