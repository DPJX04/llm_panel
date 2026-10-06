(function () {
  'use strict';

  const keyFacts = BenchPanel.require('utils/keyFacts');
  const textNormalize = BenchPanel.require('utils/textNormalize');

  test('normalize: lower case, letters and digits only, single spaces', () => {
    assert.equal(textNormalize.normalizeText('TensorRT-LLM, I2_S!  kernels'), 'tensorrt llm i2 s kernels');
    assert.equal(textNormalize.normalizeText(null), '');
  });

  test('key facts: any spelling counts, punctuation and case are ignored', () => {
    assert.ok(keyFacts.factPresent('The capital is CANBERRA.', ['canberra']));
    assert.ok(keyFacts.factPresent('It has 6 sides.', ['6', 'six']));
    assert.ok(keyFacts.factPresent('A hexagon has six sides.', ['6', 'six']));
    assert.ok(keyFacts.factPresent('Uses the Central-Processing Unit', ['central processing unit']));
  });

  test('key facts: a number must match whole, a word stem may run on', () => {
    assert.ok(!keyFacts.factPresent('It costs 40 dollars.', ['4']), '"4" is not inside "40"');
    assert.ok(!keyFacts.factPresent('version 14', ['4']), '"4" is not the end of "14"');
    assert.ok(keyFacts.factPresent('Atlantis is mythical.', ['myth']));
    assert.ok(!keyFacts.factPresent('a smyth family', ['myth']), 'a fact starts on a word boundary');
  });

  test('key facts: missingFacts lists only the facts not found', () => {
    const missing = keyFacts.missingFacts('Prefill sets the TTFT.', [['prefill'], ['decode', 'decoding'], ['ttft']]);
    assert.deepEqual(missing, [['decode', 'decoding']]);
  });
})();
