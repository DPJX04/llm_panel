(function () {
  'use strict';

  const collection = BenchPanel.require('utils/dbResultCollection');

  test('db runs: loading the same run again keeps one copy', () => {
    const merged = collection.mergeDbResults([{ id: 'a', qps: 1 }], [{ id: 'a', qps: 1 }, { id: 'b', qps: 2 }]);
    assert.deepEqual([merged.added, merged.duplicates], [1, 1]);
    assert.deepEqual(merged.results.map((entry) => entry.id), ['a', 'b']);
  });
})();
