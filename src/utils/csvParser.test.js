(function () {
  'use strict';

  const csvParser = BenchPanel.require('utils/csvParser');

  test('csv read: quoted cells keep their commas, quotes and line breaks; blank lines are skipped', () => {
    const rows = csvParser.parseCsv('db,note\r\nQdrant,"fast, ""tuned""\nrun"\r\n\r\nMilvus, plain \r\n');
    assert.deepEqual(rows, [['db', 'note'], ['Qdrant', 'fast, "tuned"\nrun'], ['Milvus', 'plain']]);
  });

  test('csv read: semicolon and tab separated files', () => {
    assert.deepEqual(csvParser.parseCsv('db;qps\nQdrant;140.2'), [['db', 'qps'], ['Qdrant', '140.2']]);
    assert.deepEqual(csvParser.parseCsv('db\tqps\nQdrant\t140.2'), [['db', 'qps'], ['Qdrant', '140.2']]);
  });
})();
