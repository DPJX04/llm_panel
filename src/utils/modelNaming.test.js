(function () {
  'use strict';

  const modelNaming = BenchPanel.require('utils/modelNaming');

  test('short names: distinct orgs name the model by org', () => {
    const names = modelNaming.defaultShortNames([
      { key: 'Twu31/Qwen3.8-27B-AWQ', modelId: 'Twu31/Qwen3.8-27B-AWQ', label: null },
      { key: 'abihsoro/Qwen3.8-27B-AWQ', modelId: 'abihsoro/Qwen3.8-27B-AWQ', label: null },
    ]);
    assert.equal(names['Twu31/Qwen3.8-27B-AWQ'], 'Twu31');
  });

  test('short names: a shared org falls back to the repo name', () => {
    const names = modelNaming.defaultShortNames([
      { key: 'Qwen/Qwen3-4B', modelId: 'Qwen/Qwen3-4B', label: null },
      { key: 'Qwen/Qwen3-8B', modelId: 'Qwen/Qwen3-8B', label: null },
    ]);
    assert.equal(names['Qwen/Qwen3-8B'], 'Qwen3-8B');
  });

  test('short names: a run label is appended, and keys include it', () => {
    const key = modelNaming.modelKeyFor('a/model', 'tp2');
    assert.equal(key, 'a/model [tp2]');
    const names = modelNaming.defaultShortNames([{ key, modelId: 'a/model', label: 'tp2' }]);
    assert.equal(names[key], 'a · tp2');
  });
})();
