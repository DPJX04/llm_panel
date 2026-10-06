(function () {
  'use strict';

  const headlineTiles = BenchPanel.require('features/vectorDb/headlineTiles');
  const OPENAI_5M = Object.freeze({ caseId: 11, customCase: null, k: 10, concurrency: [1] });

  test('db headlines: best QPS, recall and latency, each with its ef and the trade-off beside it', () => {
    const tiles = headlineTiles.buildHeadlineTiles([
      { name: 'QdrantLocal', colorSlot: 1, caseConfig: OPENAI_5M, efSearch: 64, qps: 210.5, recall: 0.981, latencyP99Ms: 17.2 },
      { name: 'ArcadeDB', colorSlot: 2, caseConfig: OPENAI_5M, efSearch: 128, qps: 95.3, recall: 0.9961, latencyP99Ms: 25 },
    ]);
    assert.deepEqual(tiles.map((tile) => [tile.label, tile.value, tile.model.name]), [
      ['Highest QPS', '210.5', 'QdrantLocal'],
      ['Best recall', '99.61%', 'ArcadeDB'],
      ['Lowest p99 latency', '17.2 ms', 'QdrantLocal'],
    ]);
    assert.equal(tiles[0].context, 'ef 64 · recall 98.10%');
  });

  test('db headlines: a metric no row measured gets no tile', () => {
    const tiles = headlineTiles.buildHeadlineTiles([
      { name: 'Q', colorSlot: 1, caseConfig: OPENAI_5M, efSearch: 64, qps: 100, recall: 0.99, latencyP99Ms: null },
    ]);
    assert.deepEqual(tiles.map((tile) => tile.label), ['Highest QPS', 'Best recall']);
  });
})();
