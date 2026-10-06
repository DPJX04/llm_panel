(function () {
  'use strict';

  const summary = BenchPanel.require('utils/dbResultSummary');

  /** A validated database run with only the fields the summary reads. */
  function run(overrides) {
    return Object.assign({
      id: 'r1', configKey: 'qdrant-ef128', seriesKey: 'qdrant', db: 'QdrantLocal', dbLabel: null, efSearch: 128,
      indexConfig: { hnsw_ef: 128 }, caseConfig: { caseId: 11, customCase: null, k: 10, concurrency: [1] },
      qps: 100, recall: 0.99, ndcg: null, latencyP99Ms: 10, concurrencyPoints: [], sourceFile: 'a.json',
    }, overrides);
  }

  test('db summary: runs of the same config become one row holding their average', () => {
    const rows = summary.averageByConfig([run(), run({ id: 'r2', qps: 140, recall: 0.97, latencyP99Ms: null, sourceFile: 'b.json' })]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].runs, 2);
    assert.near(rows[0].qps, 120);
    assert.near(rows[0].recall, 0.98);
    assert.equal(rows[0].latencyP99Ms, 10, 'a missing value is left out of the average');
    assert.equal(rows[0].ndcg, null);
    assert.deepEqual(rows[0].sourceFiles, ['a.json', 'b.json']);
  });

  test('db summary: QPS at each concurrency level is averaged over the runs that measured that level', () => {
    const rows = summary.averageByConfig([
      run({ concurrencyPoints: [{ level: 1, qps: 60, latencyP99Ms: 20 }, { level: 8, qps: 140, latencyP99Ms: 80 }] }),
      run({ id: 'r2', concurrencyPoints: [{ level: 8, qps: 160, latencyP99Ms: 90 }] }),
    ]);
    assert.deepEqual(rows[0].concurrencyPoints, [{ level: 1, qps: 60, latencyP99Ms: 20 }, { level: 8, qps: 150, latencyP99Ms: 85 }]);
  });

  test('db summary: one group per dataset and ef search, lowest ef first and no ef last; fastest row first', () => {
    const cohere = { caseId: 5, customCase: null, k: 10, concurrency: [1] };
    const groups = summary.groupByCaseAndEf(summary.averageByConfig([
      run({ id: 'a', configKey: 'q256', efSearch: 256 }),
      run({ id: 'b', configKey: 'none', efSearch: null }),
      run({ id: 'c', configKey: 'q64', efSearch: 64, qps: 50 }),
      run({ id: 'd', configKey: 'arcade64', db: 'ArcadeDB', dbLabel: 'disk', efSearch: 64, qps: 80 }),
      run({ id: 'e', configKey: 'cohere64', efSearch: 64, caseConfig: cohere }),
    ]));
    assert.deepEqual(groups.map((group) => `${group.caseShortName} ${group.efSearch}`),
      ['OpenAI 5M 64', 'OpenAI 5M 256', 'OpenAI 5M null', 'Cohere 1M 64']);
    assert.deepEqual(groups[0].rows.map((row) => [row.number, row.name]), [[1, 'ArcadeDB (disk)'], [2, 'QdrantLocal']]);
  });

  test('db summary: datasets are named from the VectorDBBench case id', () => {
    assert.equal(summary.caseName({ caseId: 11, customCase: null }), 'OpenAI 5M · 1536D');
    assert.equal(summary.caseName({ caseId: 5, customCase: null }), 'Cohere 1M · 768D');
    assert.equal(summary.caseName({ caseId: 13, customCase: null }), 'OpenAI 5M · 1536D · 1% filter');
    assert.equal(summary.caseName({ caseId: 42, customCase: null }), 'case 42');
    assert.equal(summary.caseName({ caseId: 100, customCase: 'my dataset' }), 'my dataset');
    assert.equal(summary.caseShortName({ caseId: 11, customCase: null }), 'OpenAI 5M');
  });
})();
