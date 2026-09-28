(function () {
  'use strict';

  const jsonScanner = BenchPanel.require('utils/jsonScanner');

  test('scanner: splits glued, pretty-printed and comma-separated values', () => {
    assert.deepEqual(jsonScanner.splitJsonValues('{"a":1}{"b":2}'), ['{"a":1}', '{"b":2}']);
    assert.deepEqual(jsonScanner.splitJsonValues('{\n  "a": 1\n}\n{\n  "b": 2\n}'), ['{\n  "a": 1\n}', '{\n  "b": 2\n}']);
    assert.deepEqual(jsonScanner.splitJsonValues('{"a":1},\n{"b":2}'), ['{"a":1}', '{"b":2}']);
  });

  test('scanner: brackets and quotes inside strings do not end a value', () => {
    assert.deepEqual(jsonScanner.splitJsonValues('{"t":"} ] \\" {"}[1]'), ['{"t":"} ] \\" {"}', '[1]']);
  });

  test('scanner: stray text and cut-off files are errors', () => {
    assert.throws(() => jsonScanner.splitJsonValues('hello'), /Unexpected "h"/);
    assert.throws(() => jsonScanner.splitJsonValues('{"a": {"b": 1}'), /not closed/);
  });
})();
