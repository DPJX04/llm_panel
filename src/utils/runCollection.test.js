(function () {
  'use strict';

  const runCollection = BenchPanel.require('utils/runCollection');
  const { run } = BenchPanelTests.fixtures;

  test('merge: a newer run for the same model and level replaces the older one', () => {
    const old = run({ date: '20260901-100000', output_throughput: 100 });
    const fresh = run({ date: '20260902-100000', output_throughput: 200 });
    const merged = runCollection.mergeRuns([old], [fresh]);
    assert.equal(merged.runs.length, 1);
    assert.equal(merged.runs[0].outputThroughput, 200);
    assert.equal(merged.replaced, 1);
  });

  test('merge: an older run never hides a newer one', () => {
    const fresh = run({ date: '20260902-100000', output_throughput: 200 });
    const old = run({ date: '20260901-100000', output_throughput: 100 });
    const merged = runCollection.mergeRuns([fresh], [old]);
    assert.equal(merged.runs[0].outputThroughput, 200);
    assert.equal(merged.skipped, 1);
  });

  test('merge: other levels and other models are added', () => {
    const merged = runCollection.mergeRuns([run()], [run({ max_concurrency: 8 }), run({ model_id: 'other/model' })]);
    assert.equal(merged.runs.length, 3);
    assert.equal(merged.added, 2);
  });

  test('merge: the same model under a different label is a different model', () => {
    const merged = runCollection.mergeRuns([run()], [run({ label: 'tp2' })]);
    assert.equal(merged.runs.length, 2);
  });

  test('levels sort ascending with uncapped last', () => {
    const runs = [run({ max_concurrency: 16 }), run({ max_concurrency: null }), run({ max_concurrency: 1 }), run({ max_concurrency: 4 })];
    assert.deepEqual(runCollection.concurrencyLevels(runs), [1, 4, 16, null]);
  });

  test('shared levels are the ones every model was tested at', () => {
    const runs = [
      run({ model_id: 'a/x', max_concurrency: 1 }), run({ model_id: 'a/x', max_concurrency: 16 }),
      run({ model_id: 'b/x', max_concurrency: 1 }), run({ model_id: 'b/x', max_concurrency: 8 }),
    ];
    assert.deepEqual(runCollection.sharedConcurrencyLevels(runs, ['a/x', 'b/x']), [1]);
  });

  test('baseline is the model\'s lowest-concurrency run', () => {
    const runs = [run({ max_concurrency: 8 }), run({ max_concurrency: 2 }), run({ max_concurrency: 4 })];
    assert.equal(runCollection.baselineRun(runs, runs[0].modelKey).concurrency, 2);
  });
})();
