(function () {
  'use strict';

  const extraction = BenchPanel.require('utils/answerExtraction');
  const LETTERS = ['A', 'B', 'C', 'D'];

  test('extract choice: the last "Answer: X" wins, as in simple-evals', () => {
    const reply = 'Option A looks tempting. Answer: A is wrong because...\nSo the answer must be the stack.\nAnswer: B';
    assert.deepEqual(extraction.extractChoice(reply, LETTERS), { value: 'B', strict: true });
  });

  test('extract choice: bold, brackets, lower case and \\boxed are read strictly', () => {
    assert.deepEqual(extraction.extractChoice('**Answer: (c)**', LETTERS), { value: 'C', strict: true });
    assert.deepEqual(extraction.extractChoice('The result is \\boxed{D}', LETTERS), { value: 'D', strict: true });
  });

  test('extract choice: "the answer is B" and a bare letter count, but not as the asked format', () => {
    assert.deepEqual(extraction.extractChoice('I think the answer is B.', LETTERS), { value: 'B', strict: false });
    assert.deepEqual(extraction.extractChoice(' C) ', LETTERS), { value: 'C', strict: false });
  });

  test('extract choice: a word starting with a letter is not an answer, and letters past the options are ignored', () => {
    assert.deepEqual(extraction.extractChoice('Answer: Because it is a stack', LETTERS), { value: null, strict: false });
    assert.deepEqual(extraction.extractChoice('Answer: E', LETTERS), { value: null, strict: false });
  });

  test('extract number: "Answer: N" and \\boxed{N} are strict; thousands separators are removed', () => {
    assert.deepEqual(extraction.extractNumber('Sum = 7,260.\nAnswer: 7,260'), { value: 7260, strict: true });
    assert.deepEqual(extraction.extractNumber('so x is \\boxed{8}'), { value: 8, strict: true });
    assert.deepEqual(extraction.extractNumber('Answer: $36'), { value: 36, strict: true });
    assert.deepEqual(extraction.extractNumber('Answer: -2.5'), { value: -2.5, strict: true });
  });

  test('extract number: without the format, the last number in the reply is used', () => {
    assert.deepEqual(extraction.extractNumber('3 boxes of 12 is 36, minus 9 gives 27 eggs.'), { value: 27, strict: false });
    assert.deepEqual(extraction.extractNumber('I cannot tell.'), { value: null, strict: false });
  });

  test('extract label: the last "Answer:" line names a label, whatever its case or quoting', () => {
    const labels = ['IT', 'Facilities', 'equipment fault'];
    assert.deepEqual(extraction.extractLabel('It mentions a leak.\nAnswer: **facilities**', labels), { value: 'Facilities', strict: true });
    assert.deepEqual(extraction.extractLabel('Answer: "Equipment Fault"', labels), { value: 'equipment fault', strict: true });
  });

  test('extract label: a bare label, or exactly one label mentioned, still counts but misses the format', () => {
    const labels = ['positive', 'negative', 'neutral'];
    assert.deepEqual(extraction.extractLabel('Positive.', labels), { value: 'positive', strict: false });
    assert.deepEqual(extraction.extractLabel('Overall the review is negative in tone.', labels), { value: 'negative', strict: false });
    assert.deepEqual(extraction.extractLabel('Not positive, more negative.', labels), { value: null, strict: false });
    assert.deepEqual(extraction.extractLabel('Answer: mixed', labels), { value: null, strict: false });
  });

  test('numbers equal: rounding noise is ignored, real differences are not', () => {
    assert.ok(extraction.numbersEqual(625, 625.0000000001));
    assert.ok(!extraction.numbersEqual(625, 626));
    assert.ok(!extraction.numbersEqual(null, 0));
  });
})();
