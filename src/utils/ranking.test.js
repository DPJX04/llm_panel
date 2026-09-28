(function () {
  'use strict';

  const ranking = BenchPanel.require('utils/ranking');

  test('ranking: higher-is-better puts the largest value first', () => {
    const ranked = ranking.rankEntries([{ id: 'a', value: 10 }, { id: 'b', value: 30 }, { id: 'c', value: 20 }], 'higher');
    assert.deepEqual(ranked.map((entry) => entry.id), ['b', 'c', 'a']);
    assert.deepEqual(ranked.map((entry) => entry.rank), [1, 2, 3]);
  });

  test('ranking: lower-is-better puts the smallest value first', () => {
    const ranked = ranking.rankEntries([{ id: 'a', value: 395 }, { id: 'b', value: 194 }, { id: 'c', value: 215 }], 'lower');
    assert.deepEqual(ranked.map((entry) => entry.id), ['b', 'c', 'a']);
  });

  test('ranking: ties share a rank and the next rank skips', () => {
    const ranked = ranking.rankEntries([{ value: 5 }, { value: 9 }, { value: 9 }], 'higher');
    assert.deepEqual(ranked.map((entry) => entry.rank), [1, 1, 3]);
  });

  test('ranking: missing values go last with no rank', () => {
    const ranked = ranking.rankEntries([{ id: 'a', value: null }, { id: 'b', value: 1 }], 'higher');
    assert.deepEqual(ranked.map((entry) => [entry.id, entry.rank]), [['b', 1], ['a', null]]);
  });

  test('extremes respect direction and ignore missing values', () => {
    assert.deepEqual(ranking.extremes([3, null, 1, 2], 'higher'), { best: 3, worst: 1 });
    assert.deepEqual(ranking.extremes([3, null, 1, 2], 'lower'), { best: 1, worst: 3 });
    assert.deepEqual(ranking.extremes([null], 'lower'), { best: null, worst: null });
  });
})();
