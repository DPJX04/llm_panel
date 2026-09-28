(function () {
  'use strict';

  const settingsConsistency = BenchPanel.require('utils/settingsConsistency');
  const { run } = BenchPanelTests.fixtures;

  const name = (key) => key.split('/')[0];

  test('settings: identical runs raise nothing', () => {
    const runs = [run({ model_id: 'a/x' }), run({ model_id: 'b/x' })];
    assert.deepEqual(settingsConsistency.findSettingDifferences(runs, name), []);
  });

  test('settings: a different output length at the same level is reported with the models involved', () => {
    const runs = [run({ model_id: 'a/x' }), run({ model_id: 'b/x', total_output_tokens: 160 * 180 })];
    const [difference] = settingsConsistency.findSettingDifferences(runs, name);
    assert.equal(difference.label, 'Output tokens per request');
    assert.equal(difference.level, 4);
    assert.equal(difference.detail, '256 (a) vs 180 (b)');
  });

  test('settings: small token-count wobble and different levels are not flagged', () => {
    const runs = [
      run({ model_id: 'a/x', total_input_tokens: 37801 }),
      run({ model_id: 'b/x', total_input_tokens: 38100 }),
      run({ model_id: 'a/x', max_concurrency: 16, num_prompts: 320, completed: 320 }),
    ];
    assert.deepEqual(settingsConsistency.findSettingDifferences(runs, name), []);
  });
})();
