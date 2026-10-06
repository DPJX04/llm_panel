(function () {
  'use strict';

  const collection = BenchPanel.require('utils/evalReportCollection');

  function report(modelKey, questionSetId, createdAt) {
    return { id: `${modelKey}@@${questionSetId}@@${createdAt}`, modelKey, questionSetId, questionSetTitle: questionSetId.toUpperCase(), createdAt };
  }

  test('eval reports: one per model and question set, the newest wins', () => {
    const existing = [report('a', 'set1', '2026-10-01T00:00:00Z')];
    const merged = collection.mergeEvalReports(existing, [
      report('a', 'set1', '2026-10-02T00:00:00Z'),
      report('a', 'set1', '2026-09-01T00:00:00Z'),
      report('b', 'set1', '2026-10-01T00:00:00Z'),
    ]);
    assert.deepEqual([merged.added, merged.replaced, merged.skipped], [1, 1, 1]);
    assert.deepEqual(merged.reports.map((entry) => entry.createdAt), ['2026-10-02T00:00:00Z', '2026-10-01T00:00:00Z']);
  });

  test('eval reports: question sets are listed most recently run first', () => {
    const sets = collection.questionSetsOf([
      report('a', 'old', '2026-09-01T00:00:00Z'),
      report('a', 'new', '2026-10-03T00:00:00Z'),
      report('b', 'old', '2026-10-02T00:00:00Z'),
    ]);
    assert.deepEqual(sets, [{ id: 'new', title: 'NEW' }, { id: 'old', title: 'OLD' }]);
  });
})();
