(function () {
  'use strict';

  const parser = BenchPanel.require('services/dbResultParser');

  const TASK_CONFIG = Object.freeze({
    db: 'QdrantLocal',
    db_config: { db_label: '', version: '', note: '', url: 'http://user:secret@10.0.0.5:6333' },
    db_case_config: { metric_type: 'COSINE', m: 16, ef_construct: 100, hnsw_ef: 128, on_disk: false },
    case_config: { case_id: 11, custom_case: null, k: 10, nq: 1, concurrency_search_config: { num_concurrency: [1, 8, 16, 32], concurrency_duration: 30 } },
  });

  /** A VectorDBBench result file shaped like a real QdrantLocal run. `entry` and `file` override its parts. */
  function resultFile(entry, file) {
    return Object.assign({
      run_id: '0e58063c48d04923b51ff4d609141b0c',
      task_label: '5m_64-32g_128_1',
      results: [Object.assign({
        metrics: {
          qps: 140.24, serial_latency_p99: 0.0172, recall: 0.9952, ndcg: 0.9953,
          conc_num_list: [1, 8, 16, 32], conc_qps_list: [64.47, 140.24, 139.49, 140.2], conc_latency_p99_list: [0.0195, 0.0788, 0.1588, 0.3307],
        },
        task_config: TASK_CONFIG,
        label: ':)',
      }, entry)],
      file_fmt: 'result_{}_{}_{}.json',
      timestamp: 1791129600.0,
    }, file);
  }

  /** The entry override that changes only the index config, e.g. a different ef. */
  function withIndexConfig(changes) {
    return { task_config: { ...TASK_CONFIG, db_case_config: { ...TASK_CONFIG.db_case_config, ...changes } } };
  }

  function parse(entry, file) {
    return parser.parseDbResultText(JSON.stringify(resultFile(entry, file)), 'result_qdrantlocal.json');
  }

  test('db result: a VectorDBBench file gives QPS, recall and the ef search from hnsw_ef', () => {
    const parsed = parse();
    assert.ok(parsed.ok, parsed.error);
    const [entry] = parsed.data.results;
    assert.equal(entry.db, 'QdrantLocal');
    assert.equal(entry.dbLabel, null);
    assert.equal(entry.efSearch, 128);
    assert.equal(entry.qps, 140.24);
    assert.equal(entry.recall, 0.9952);
    assert.near(entry.latencyP99Ms, 17.2, 1e-9);
    assert.deepEqual(entry.caseConfig, { caseId: 11, customCase: null, k: 10, concurrency: [1, 8, 16, 32] });
    assert.deepEqual(Object.keys(entry.indexConfig), ['ef_construct', 'hnsw_ef', 'm', 'metric_type', 'on_disk']);
    assert.equal(entry.createdAt, '2026-10-04T16:00:00.000Z');
    assert.equal(entry.taskLabel, '5m_64-32g_128_1');
  });

  test('db result: QPS and p99 latency at each concurrency level, latency in ms', () => {
    const points = parse().data.results[0].concurrencyPoints;
    assert.deepEqual(points.map((point) => [point.level, point.qps]), [[1, 64.47], [8, 140.24], [16, 139.49], [32, 140.2]]);
    assert.near(points[1].latencyP99Ms, 78.8, 1e-9);
  });

  test('db result: ef search is found under the names other databases use, never ef_construct', () => {
    ['ef_search', 'efSearch', 'ef', 'ef_runtime', 'hnswEf'].forEach((key) => {
      const entry = parse({ task_config: { db: 'Other', db_case_config: { m: 16, ef_construct: 100, [key]: 64 } } }).data.results[0];
      assert.equal(entry.efSearch, 64, key);
    });
    const none = parse({ task_config: { db: 'Other', db_case_config: { ef_construct: 100 } } }).data.results[0];
    assert.equal(none.efSearch, null);
  });

  test('db result: failed runs and runs without search results become warnings', () => {
    const failed = parse({ label: 'x' });
    assert.equal(failed.data.results.length, 0);
    assert.ok(/failed/.test(failed.data.warnings[0]), failed.data.warnings[0]);
    const noSearch = parse({ metrics: { qps: 0, recall: 0 } });
    assert.ok(/no search results/.test(noSearch.data.warnings[0]), noSearch.data.warnings[0]);
    const recallOnly = parse({ metrics: { qps: 0, recall: 0.9 } }).data.results[0];
    assert.deepEqual([recallOnly.qps, recallOnly.recall], [null, 0.9], 'a stage that did not run is missing, not 0');
  });

  test('db result: other JSON is left for other parsers', () => {
    assert.equal(parser.parseDbResultText('{"model_id": "x"}', 'bench.json'), null);
    assert.equal(parser.parseDbResultText('{"results": [{"completed": 1}]}', 'bench.json'), null);
    assert.equal(parser.parseDbResultText('not json', 'notes.txt'), null);
  });

  test('db result: the saved copy parses back to the same run, without the server address', () => {
    const entry = parse().data.results[0];
    const reloaded = parser.toDbResults(JSON.parse(JSON.stringify(entry.raw)), entry.sourceFile);
    assert.ok(reloaded.ok, reloaded.error);
    assert.deepEqual(reloaded.data.results[0], entry);
    assert.ok(!JSON.stringify(entry.raw).includes('secret'));
  });

  test('db result: repeat runs of one config share a config key; a different ef or database does not', () => {
    const first = parse().data.results[0];
    const repeat = parse(undefined, { run_id: 'another-run', task_label: '5m_64-32g_128_2' }).data.results[0];
    const otherEf = parse(withIndexConfig({ hnsw_ef: 256 })).data.results[0];
    const otherDb = parse({ task_config: { ...TASK_CONFIG, db: 'ArcadeDB' } }).data.results[0];
    assert.equal(first.configKey, repeat.configKey);
    assert.ok(first.id !== repeat.id, 'different runs keep different ids');
    assert.ok(first.configKey !== otherEf.configKey);
    assert.ok(first.configKey !== otherDb.configKey);
    assert.equal(first.seriesKey, otherEf.seriesKey, 'a different ef is the same line in the charts');
    assert.ok(first.seriesKey !== otherDb.seriesKey);
    const otherCase = parse({ task_config: { ...TASK_CONFIG, case_config: { ...TASK_CONFIG.case_config, case_id: 5 } } }).data.results[0];
    assert.ok(first.configKey !== otherCase.configKey, 'another dataset is never averaged in');
    assert.equal(first.seriesKey, otherCase.seriesKey, 'but the database keeps its colour on every dataset');
  });
})();
