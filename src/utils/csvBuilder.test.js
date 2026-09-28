(function () {
  'use strict';

  const csvBuilder = BenchPanel.require('utils/csvBuilder');

  test('csv: quotes cells with commas, quotes or newlines', () => {
    assert.equal(csvBuilder.toCsv(['a', 'b'], [['x,y', 'say "hi"']]), 'a,b\r\n"x,y","say ""hi"""');
  });

  test('csv: text that Excel would run as a formula is defused; numbers are not', () => {
    assert.equal(csvBuilder.toCsv(['a', 'b'], [['=HYPERLINK("x")', -3]]), 'a,b\r\n"\'=HYPERLINK(""x"")",-3');
  });

  test('csv: missing values are empty cells', () => {
    assert.equal(csvBuilder.toCsv(['a', 'b'], [[null, undefined]]), 'a,b\r\n,');
  });
})();
