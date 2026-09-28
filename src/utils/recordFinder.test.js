(function () {
  'use strict';

  const recordFinder = BenchPanel.require('utils/recordFinder');

  function hints(value) {
    return recordFinder.findRunRecords(value).map((found) => found.concurrencyHint);
  }

  test('records: a bare record and an array of records', () => {
    assert.deepEqual(hints({ model_id: 'm' }), [null]);
    assert.deepEqual(hints([{ model_id: 'm' }, { model_id: 'n' }]), [null, null]);
  });

  test('records: found inside a wrapper object', () => {
    assert.deepEqual(hints({ meta: { gpu: 'L40S' }, results: [{ model_id: 'm' }, { model_id: 'm' }] }), [null, null]);
  });

  test('records: keys like "16" or "c16" become the concurrency hint', () => {
    assert.deepEqual(hints({ 1: { model_id: 'm' }, c16: { model_id: 'm' }, concurrency_8: { model_id: 'm' } }), [1, 16, 8]);
    assert.equal(recordFinder.concurrencyFromKey('results'), null);
  });

  test('records: an object with no records is passed on for the validator to reject', () => {
    const found = recordFinder.findRunRecords({ hello: 'world' });
    assert.equal(found.length, 1);
    assert.deepEqual(found[0].record, { hello: 'world' });
  });
})();
