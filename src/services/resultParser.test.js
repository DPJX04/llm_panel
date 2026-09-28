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

  test('parser: one file holding concurrency 1-16 loads in every common layout', () => {
    const runs = [1, 2, 4, 8, 16].map((level) => rawRun({ max_concurrency: level }));
    const layouts = {
      'array': JSON.stringify(runs, null, 2),
      'json lines': runs.map((raw) => JSON.stringify(raw)).join('\n'),
      'pretty-printed back to back': runs.map((raw) => JSON.stringify(raw, null, 2)).join('\n'),
      'glued on one line': runs.map((raw) => JSON.stringify(raw)).join(''),
      'comma separated': runs.map((raw) => JSON.stringify(raw, null, 2)).join(',\n'),
      'wrapper object': JSON.stringify({ results: runs }),
    };
    Object.keys(layouts).forEach((layout) => {
      const parsed = resultParser.parseResultText(layouts[layout], 'all.json');
      assert.ok(parsed.ok, `${layout}: ${parsed.error}`);
      assert.deepEqual(parsed.data.runs.map((item) => item.concurrency), [1, 2, 4, 8, 16], layout);
    });
  });

  test('parser: an object keyed by concurrency fills in a missing max_concurrency', () => {
    const noLevel = rawRun();
    delete noLevel.max_concurrency;
    const parsed = resultParser.parseResultText(JSON.stringify({ c1: noLevel, c16: noLevel }), 'keyed.json');
    assert.deepEqual(parsed.data.runs.map((item) => item.concurrency), [1, 16]);
    assert.equal(parsed.data.runs[1].raw.max_concurrency, 16, 'kept for workspace export');
  });

  test('parser: per-request arrays from --save-detailed are not kept', () => {
    const parsed = resultParser.parseResultText(JSON.stringify(rawRun({ ttfts: [0.1, 0.2], generated_texts: ['a', 'b'] })), 'detailed.json');
    assert.equal(parsed.data.runs[0].raw.ttfts, undefined);
    assert.equal(parsed.data.runs[0].raw.generated_texts, undefined);
    assert.equal(parsed.data.runs[0].raw.model_id, 'Qwen/Qwen3-4B-Instruct-2507');
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
    const profile = {
      shortName: 'Qwen 4B', modelSizeGb: 7.63, gpuMemoryTotalGb: 24,
      gpus: [{ gpuUtilPct: 95.7, memoryUsedGb: 21.3, memoryUtilPct: 93.6, powerW: 223.9, temperatureC: 67.3 }],
      kvCache: { memoryGb: 12.34, sizeTokens: 89856, maxModelLen: 32768, maxConcurrency: 2.74 },
    };
    const state = {
      runs: [run({ max_concurrency: 1 }), run({ max_concurrency: 8 })],
      profiles: { 'Qwen/Qwen3-4B-Instruct-2507': profile },
      modelOrder: ['Qwen/Qwen3-4B-Instruct-2507'],
    };
    const text = JSON.stringify(workspaceStorage.toWorkspaceFile(state));
    const parsed = resultParser.parseResultText(text, 'workspace.json');
    assert.ok(parsed.ok, parsed.error);
    const workspace = parsed.data.workspace;
    assert.equal(workspace.runs.length, 2);
    assert.deepEqual(workspace.profiles['Qwen/Qwen3-4B-Instruct-2507'], profile);
    assert.deepEqual(workspace.modelOrder, ['Qwen/Qwen3-4B-Instruct-2507']);
  });

  test('parser: a profile saved by the first version (one GPU, flat fields) still loads', () => {
    const profile = resultParser.toProfile({ shortName: 'Twu31', modelSizeGb: 18.2, vramGb: 21.02, gpuUtilPct: 85.9, powerW: 205.1 });
    assert.equal(profile.gpus.length, 1);
    assert.equal(profile.gpus[0].memoryUsedGb, 21.02);
    assert.equal(profile.gpus[0].gpuUtilPct, 85.9);
    assert.equal(profile.gpus[0].powerW, 205.1);
    assert.equal(profile.kvCache.sizeTokens, null);
  });

  test('parser: profile values are cleaned at the boundary', () => {
    const profile = resultParser.toProfile({
      shortName: `  ${'x'.repeat(80)}  `, modelSizeGb: 18.2, gpuMemoryTotalGb: -24,
      gpus: [{ gpuUtilPct: 150, memoryUsedGb: -1, powerW: '200', temperatureC: 400 }],
      kvCache: { sizeTokens: 'lots', maxConcurrency: 2.5 },
    });
    assert.equal(profile.shortName.length, 40);
    assert.equal(profile.modelSizeGb, 18.2);
    assert.equal(profile.gpuMemoryTotalGb, null, 'negative capacity');
    assert.deepEqual(profile.gpus[0], { gpuUtilPct: null, memoryUsedGb: null, memoryUtilPct: null, powerW: null, temperatureC: null });
    assert.equal(profile.kvCache.sizeTokens, null, 'text');
    assert.equal(profile.kvCache.maxConcurrency, 2.5);
  });

  test('parser: at most 16 GPUs are kept, and an empty GPU list becomes one blank GPU', () => {
    assert.equal(resultParser.toProfile({ gpus: new Array(40).fill({ powerW: 100 }) }).gpus.length, 16);
    assert.equal(resultParser.toProfile({ gpus: [] }).gpus.length, 1);
  });
})();
