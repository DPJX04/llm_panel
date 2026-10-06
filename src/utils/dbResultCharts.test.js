(function () {
  'use strict';

  const charts = BenchPanel.require('utils/dbResultCharts');

  const OPENAI_5M = Object.freeze({ caseId: 11, customCase: null, k: 10, concurrency: [1, 8] });
  const COHERE_1M = Object.freeze({ caseId: 5, customCase: null, k: 10, concurrency: [1, 8] });

  /** An averaged row with only the fields the charts read. */
  function row(seriesKey, name, efSearch, values) {
    return Object.assign({ seriesKey, name, efSearch, caseConfig: OPENAI_5M, qps: null, recall: null, latencyP99Ms: null, concurrencyPoints: [] }, values);
  }

  test('db charts: one colour per database; a second setup of it in the same dataset is numbered', () => {
    const rows = charts.withLines([
      row('qdrant-m16', 'QdrantLocal', 128),
      row('arcade', 'ArcadeDB', 128),
      row('qdrant-m16', 'QdrantLocal', 64, { caseConfig: COHERE_1M }),
      row('qdrant-m32', 'QdrantLocal', 128),
      row('qdrant-m32', 'QdrantLocal', 64),
    ]);
    assert.deepEqual(rows.map((entry) => [entry.name, entry.colorSlot]),
      [['QdrantLocal', 1], ['ArcadeDB', 2], ['QdrantLocal', 1], ['QdrantLocal #2', 3], ['QdrantLocal #2', 3]]);
  });

  test('db charts: a setup that is the only one of its database in a dataset keeps the plain name and colour', () => {
    const rows = charts.withLines([
      row('qdrant-json', 'QdrantLocal', 128),
      row('qdrant-csv', 'QdrantLocal', 64, { caseConfig: COHERE_1M }),
    ]);
    assert.deepEqual(rows.map((entry) => [entry.name, entry.colorSlot]), [['QdrantLocal', 1], ['QdrantLocal', 1]]);
  });

  test('db charts: QPS-versus-recall lines run in ef order; a row missing either value has no point', () => {
    const lines = charts.tradeoffLines(charts.withLines([
      row('qdrant', 'QdrantLocal', 128, { qps: 145, recall: 0.995 }),
      row('qdrant', 'QdrantLocal', 64, { qps: 210, recall: 0.981 }),
      row('arcade', 'ArcadeDB', 128, { qps: 95, recall: null }),
    ]));
    assert.deepEqual(lines.map((line) => [line.name, line.points.map((point) => point.efSearch)]), [['QdrantLocal', [64, 128]]]);
  });

  test('db charts: the QPS lead is averaged over the ef values both databases ran', () => {
    const lines = charts.tradeoffLines(charts.withLines([
      row('qdrant', 'QdrantLocal', 64, { qps: 210, recall: 0.98 }),
      row('qdrant', 'QdrantLocal', 128, { qps: 150, recall: 0.99 }),
      row('qdrant', 'QdrantLocal', 256, { qps: 90, recall: 0.999 }),
      row('arcade', 'ArcadeDB', 64, { qps: 120, recall: 0.99 }),
      row('arcade', 'ArcadeDB', 128, { qps: 100, recall: 0.996 }),
    ]));
    const lead = charts.qpsLead(lines);
    assert.deepEqual([lead.leader, lead.runnerUp, lead.efValues], ['QdrantLocal', 'ArcadeDB', [64, 128]]);
    assert.near(lead.ratio, 180 / 110);
    assert.equal(charts.qpsLead(lines.slice(0, 1)), null, 'one database has no lead');
  });

  test('db charts: grouped columns, one group per ef, each database in its own place', () => {
    const columns = charts.columnGroups(charts.withLines([
      row('qdrant', 'QdrantLocal', 128, { qps: 145 }),
      row('arcade', 'ArcadeDB', 128, { qps: 95 }),
      row('qdrant', 'QdrantLocal', 64, { qps: 210 }),
    ]), 'qps');
    assert.deepEqual(columns.series.map((line) => line.name), ['QdrantLocal', 'ArcadeDB']);
    assert.deepEqual(columns.groups, [
      { label: 'ef=64', values: [210, null] },
      { label: 'ef=128', values: [145, 95] },
    ]);
  });

  test('db charts: a metric against concurrency, one line per row', () => {
    const rows = charts.withLines([
      row('qdrant', 'QdrantLocal', 128, { concurrencyPoints: [{ level: 1, qps: 64 }, { level: 8, qps: 140 }] }),
      row('arcade', 'ArcadeDB', 128, { concurrencyPoints: [{ level: 8, qps: 90 }, { level: 16, qps: 95 }] }),
    ]);
    const trend = charts.concurrencyTrend(rows, 'qps');
    assert.deepEqual(trend.xValues, [1, 8, 16]);
    assert.deepEqual(trend.series.map((line) => line.values), [[64, 140, null], [null, 90, 95]]);
  });
})();
