(function () {
  'use strict';

  const runSettings = BenchPanel.require('utils/runSettings');

  const typed = { temperature: '0.7', maxTokens: '4096', repeats: '3', concurrency: '4', timeoutS: '120', limit: '', systemPrompt: '  Be brief.  ' };

  test('run settings: typed values become numbers; an empty "first N" means every question', () => {
    const checked = runSettings.validateRunSettings(typed);
    assert.ok(checked.ok, checked.error);
    assert.deepEqual(checked.data, { temperature: 0.7, maxTokens: 4096, repeats: 3, concurrency: 4, timeoutS: 120, limit: null, systemPrompt: 'Be brief.' });
  });

  test('run settings: every problem is reported at once', () => {
    const checked = runSettings.validateRunSettings({ ...typed, temperature: '3', repeats: '1.5', concurrency: '', limit: '0' });
    assert.ok(!checked.ok);
    const problems = checked.error.split('\n');
    assert.equal(problems.length, 4);
    assert.ok(problems[0].startsWith('Temperature must be a number from 0 to 2'));
    assert.ok(problems[1].startsWith('Repeats must be a whole number'));
  });
})();
