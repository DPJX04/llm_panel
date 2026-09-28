(function () {
  'use strict';

  const resultParser = BenchPanel.require('services/resultParser');
  const workspaceStorage = BenchPanel.require('services/workspaceStorageService');
  const { rawRun, run } = BenchPanelTests.fixtures;

  test('parser: reads a vLLM bench serve result', () => {
    const parsed = resultParser.parseResultText(JSON.stringify(rawRun()), 'Result.md');
    assert.ok(parsed.ok, parsed.error);
    const [only] = parsed.data.runs;
    assert.equal(only.modelId, 'Qwen/Qwen3-4B-Instruct-2507');
    assert.equal(only.concurrency, 4);
    assert.equal(only.outputThroughput, 282.7096);
    assert.equal(only.ttft.p95, 58.051);
    assert.equal(only.itl.mean, null, 'absent stats are null');
    assert.equal(only.sourceFile, 'Result.md');
  });

  test('parser: reads JSON Lines, arrays, and JSON fenced in Markdown', () => {
    const lines = [rawRun({ max_concurrency: 1 }), rawRun({ max_concurrency: 2 })].map((raw) => JSON.stringify(raw)).join('\n');
    assert.equal(resultParser.parseResultText(lines, 'a.jsonl').data.runs.length, 2, 'jsonl');
    assert.equal(resultParser.parseResultText(JSON.stringify([rawRun(), rawRun()]), 'a.json').data.runs.length, 2, 'array');
    const markdown = `# Results\n\n\`\`\`json\n${JSON.stringify(rawRun())}\n\`\`\`\n`;
    assert.equal(resultParser.parseResultText(markdown, 'a.md').data.runs.length, 1, 'markdown');
  });

  test('parser: names the missing fields of an incomplete record', () => {
    const raw = rawRun();
    delete raw.mean_tpot_ms;
    delete raw.model_id;
    const parsed = resultParser.parseResultText(JSON.stringify(raw), 'bad.json');
    assert.equal(parsed.ok, false);
    assert.ok(/model_id/.test(parsed.error) && /mean_tpot_ms/.test(parsed.error), parsed.error);
  });

  test('parser: keeps good records and warns about bad ones', () => {
    const parsed = resultParser.parseResultText(JSON.stringify([rawRun(), { model_id: 'x' }]), 'mixed.json');
    assert.equal(parsed.data.runs.length, 1);
    assert.equal(parsed.data.warnings.length, 1);
  });

  test('parser: rejects text that is not JSON', () => {
    const parsed = resultParser.parseResultText('hello there', 'notes.txt');
    assert.equal(parsed.ok, false);
    assert.ok(/notes\.txt/.test(parsed.error), parsed.error);
  });

  test('parser: a missing concurrency cap means uncapped', () => {
    assert.equal(run({ max_concurrency: null }).concurrency, null);
  });

  test('parser: a workspace file round-trips runs, profiles and model order', () => {
    const state = {
      runs: [run({ max_concurrency: 1 }), run({ max_concurrency: 8 })],
      profiles: { 'Qwen/Qwen3-4B-Instruct-2507': { shortName: 'Qwen 4B', modelSizeGb: 8, vramGb: 21.02, gpuUtilPct: 85.9, powerW: 205.1 } },
      modelOrder: ['Qwen/Qwen3-4B-Instruct-2507'],
    };
    const text = JSON.stringify(workspaceStorage.toWorkspaceFile(state));
    const parsed = resultParser.parseResultText(text, 'workspace.json');
    assert.ok(parsed.ok, parsed.error);
    const workspace = parsed.data.workspace;
    assert.equal(workspace.runs.length, 2);
    assert.equal(workspace.profiles['Qwen/Qwen3-4B-Instruct-2507'].vramGb, 21.02);
    assert.deepEqual(workspace.modelOrder, ['Qwen/Qwen3-4B-Instruct-2507']);
  });

  test('parser: profile values are cleaned at the boundary', () => {
    const profile = resultParser.toProfile({ shortName: `  ${'x'.repeat(80)}  `, vramGb: -1, gpuUtilPct: 150, powerW: '200', modelSizeGb: 18.2 });
    assert.equal(profile.shortName.length, 40);
    assert.equal(profile.vramGb, null, 'negative');
    assert.equal(profile.gpuUtilPct, null, 'over 100%');
    assert.equal(profile.powerW, null, 'string');
    assert.equal(profile.modelSizeGb, 18.2);
  });
})();
