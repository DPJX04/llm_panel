(function () {
  'use strict';

  const resultRows = BenchPanel.require('features/accuracy/resultRows');
  const { run } = BenchPanelTests.fixtures;

  function model(key, hasRuns) {
    return { key, modelId: key, label: null, name: key, colorSlot: 1, profile: {}, hasRuns, hasEvalReports: true };
  }

  function report(modelKey, outcomes, totalMs) {
    return {
      id: modelKey, modelKey, questionSetId: 'set', questionSetTitle: 'Set', createdAt: '2026-10-05T00:00:00Z',
      cases: outcomes.map((outcome, index) => ({ id: `q${index}`, kind: 'short', category: 'c', outcome, formatFollowed: true,
        totalMs, ttftMs: 50, outputTokens: 20, finishReason: 'stop' })),
    };
  }

  test('result rows: best accuracy first, then the quicker model; bench speed joins where runs exist', () => {
    const reports = [
      report('slow', ['correct', 'correct'], 3000),
      report('fast', ['correct', 'correct'], 1000),
      report('weak', ['correct', 'incorrect'], 500),
      { ...report('other-set', ['correct'], 100), questionSetId: 'elsewhere' },
    ];
    const runs = [
      run({ model_id: 'fast', max_concurrency: 1 }),
      run({ model_id: 'fast', max_concurrency: 16, output_throughput: 900 }),
    ];
    const { rows, levels } = resultRows.buildResultRows(reports, 'set',
      [model('slow', false), model('fast', true), model('weak', false), model('other-set', false)], runs);
    assert.deepEqual(rows.map((row) => row.model.key), ['fast', 'slow', 'weak']);
    assert.deepEqual([levels.low, levels.peak], [1, 16]);
    assert.equal(rows[0].peakRun.outputThroughput, 900);
    assert.equal(rows[1].peakRun, null);
  });
})();
