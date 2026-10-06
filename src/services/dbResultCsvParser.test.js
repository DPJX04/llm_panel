(function () {
  'use strict';

  const csvParser = BenchPanel.require('services/dbResultCsvParser');
  const dbResultParser = BenchPanel.require('services/dbResultParser');

  const CSV = [
    'DB,hnsw_ef,m,ef_construct,QPS,Recall,P99 latency (ms),case_id,k',
    'QdrantLocal,128,16,100,140.24,0.9952,17.2,11,10',
    'QdrantLocal,128,16,100,150.1,99.40%,18,11,10',
    'ArcadeDB,64,16,100,131.2,99.02,19,11,10',
  ].join('\n');

  test('db csv: each row is a run, read like a VectorDBBench result', () => {
    const parsed = csvParser.parseDbResultCsv(CSV, 'runs.csv');
    assert.ok(parsed.ok, parsed.error);
    assert.deepEqual(parsed.data.warnings, []);
    const [first, repeat, arcade] = parsed.data.results;
    assert.deepEqual([first.db, first.efSearch, first.qps, first.recall], ['QdrantLocal', 128, 140.24, 0.9952]);
    assert.near(first.latencyP99Ms, 17.2, 1e-9);
    assert.deepEqual(first.caseConfig, { caseId: 11, customCase: null, k: 10, concurrency: [] });
    assert.equal(first.sourceFile, 'runs.csv row 2');
    assert.equal(first.configKey, repeat.configKey, 'two rows of one config are averaged');
    assert.ok(first.id !== repeat.id, 'and each row is its own run');
    assert.near(repeat.recall, 0.994, 1e-12);
    assert.near(arcade.recall, 0.9902, 1e-12, 'a recall written as a percentage');
  });

  test('db csv: loading the same CSV again gives the same run ids', () => {
    const ids = (text) => csvParser.parseDbResultCsv(text, 'runs.csv').data.results.map((entry) => entry.id);
    assert.deepEqual(ids(CSV), ids(CSV));
  });

  test('db csv: a row saved in the workspace loads back the same', () => {
    const entry = csvParser.parseDbResultCsv(CSV, 'runs.csv').data.results[0];
    const reloaded = dbResultParser.toDbResults(JSON.parse(JSON.stringify(entry.raw)), entry.sourceFile);
    assert.deepEqual(reloaded.data.results[0], entry);
  });

  test('db csv: a dataset name stands in for the case id; seconds latency as VectorDBBench writes it', () => {
    const entry = csvParser.parseDbResultCsv('db,ef_search,qps,recall,dataset,serial_latency_p99\nMilvus,64,900,0.95,My docs 2M,0.0172', 'r.csv').data.results[0];
    assert.equal(entry.caseConfig.customCase, 'My docs 2M');
    assert.equal(entry.efSearch, 64);
    assert.near(entry.latencyP99Ms, 17.2, 1e-9);
  });

  test('db csv: a row with no usable result, or a number it cannot be sure of, becomes a warning', () => {
    const parsed = csvParser.parseDbResultCsv('db,qps,recall\nQdrant,,\nMilvus,"140,24",\nWeaviate,120,0.97', 'r.csv');
    assert.deepEqual(parsed.data.results.map((entry) => entry.db), ['Weaviate']);
    assert.equal(parsed.data.warnings.length, 2);
    assert.ok(/r\.csv row 2/.test(parsed.data.warnings[0]), parsed.data.warnings[0]);
  });

  test('db csv: a CSV without a database column is refused with a reason', () => {
    const parsed = csvParser.parseDbResultCsv('qps,recall\n100,0.9', 'r.csv');
    assert.ok(!parsed.ok && /"db" column/.test(parsed.error), parsed.error);
  });
})();
