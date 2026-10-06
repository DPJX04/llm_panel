(function () {
  'use strict';

  const evalSummary = BenchPanel.require('utils/evalSummary');

  function evalCase(overrides) {
    return Object.assign({ id: 'q', kind: 'short', category: 'facts', outcome: 'correct', formatFollowed: true,
      totalMs: 1000, ttftMs: 100, outputTokens: 10, finishReason: 'stop' }, overrides);
  }

  test('eval summary: rates follow SimpleQA and leave out questions with no reply', () => {
    const summary = evalSummary.summarizeReport({ cases: [
      evalCase({ outcome: 'correct' }),
      evalCase({ outcome: 'correct' }),
      evalCase({ outcome: 'incorrect' }),
      evalCase({ outcome: 'not-attempted' }),
      evalCase({ outcome: 'error', totalMs: null, ttftMs: null, outputTokens: null, finishReason: null }),
    ] });
    assert.equal(summary.cases, 5);
    assert.equal(summary.scored, 4);
    assert.equal(summary.errors, 1);
    assert.equal(summary.accuracy, 0.5);
    assert.near(summary.accuracyGivenAttempted, 2 / 3, 1e-9);
    assert.equal(summary.incorrectRate, 0.25);
    assert.equal(summary.notAttemptedRate, 0.25);
    assert.equal(summary.meanTotalMs, 1000);
  });

  test('eval summary: with repeats, rates count every try and the range spans the passes', () => {
    const summary = evalSummary.summarizeReport({ cases: [
      evalCase({ id: 'a', attempt: 1, outcome: 'correct' }),
      evalCase({ id: 'b', attempt: 1, outcome: 'correct' }),
      evalCase({ id: 'a', attempt: 2, outcome: 'correct' }),
      evalCase({ id: 'b', attempt: 2, outcome: 'incorrect' }),
    ] });
    assert.deepEqual([summary.questions, summary.repeats, summary.cases], [2, 2, 4]);
    assert.equal(summary.accuracy, 0.75);
    assert.deepEqual(summary.accuracyRange, { min: 0.5, max: 1 });
    assert.equal(evalSummary.summarizeReport({ cases: [evalCase({})] }).accuracyRange, null);
  });

  test('eval summary: format misses count only choice and number questions', () => {
    const summary = evalSummary.summarizeReport({ cases: [
      evalCase({ kind: 'number', formatFollowed: false }),
      evalCase({ kind: 'choice', formatFollowed: true }),
      evalCase({ kind: 'short', formatFollowed: false }),
    ] });
    assert.equal(summary.formatErrorRate, 0.5);
  });

  test('eval summary: decode speed is tokens after the first over the time after the first token', () => {
    assert.equal(evalSummary.decodeSpeed(evalCase({ outputTokens: 101, totalMs: 2100, ttftMs: 100 })), 50);
    assert.equal(evalSummary.decodeSpeed(evalCase({ outputTokens: 1 })), null);
  });

  test('eval summary: accuracy per category, in first-seen order, and replies cut at the token limit', () => {
    const summary = evalSummary.summarizeReport({ cases: [
      evalCase({ category: 'math', outcome: 'correct' }),
      evalCase({ category: 'facts', outcome: 'incorrect', finishReason: 'length' }),
      evalCase({ category: 'math', outcome: 'incorrect' }),
    ] });
    assert.deepEqual(summary.categories, [{ category: 'math', cases: 2, accuracy: 0.5 }, { category: 'facts', cases: 1, accuracy: 0 }]);
    assert.equal(summary.truncated, 1);
  });
})();
