(function () {
  'use strict';

  const { rougeL } = BenchPanel.require('utils/rougeL');

  test('rouge-L: identical text scores 1, unrelated text 0, word order matters', () => {
    assert.equal(rougeL('The pump failed.', 'the pump failed'), 1);
    assert.equal(rougeL('Sunny weather today', 'the pump failed'), 0);
    // Longest shared in-order run "the pump failed" (3 of 5 words in each): F = 0.6.
    assert.near(rougeL('the old pump finally failed', 'the pump failed last night'), 0.6, 1e-9);
    assert.equal(rougeL('anything', ''), null);
  });
})();
