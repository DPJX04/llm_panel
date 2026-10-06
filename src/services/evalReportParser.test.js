(function () {
  'use strict';

  const parser = BenchPanel.require('services/evalReportParser');
  const resultParser = BenchPanel.require('services/resultParser');
  const storage = BenchPanel.require('services/workspaceStorageService');
  const builder = BenchPanel.require('utils/evalReportBuilder');
  const caseBuilder = BenchPanel.require('utils/evalCaseBuilder');
  const { run } = BenchPanelTests.fixtures;

  const question = { id: 'm1', kind: 'number', category: 'math', question: '2+2?', choices: [], reference: '4', keyFacts: [], answerable: true, declineFacts: [] };

  function reportFile(overrides) {
    return builder.buildReportFile(Object.assign({
      modelId: 'Qwen/Qwen3-4B-Instruct-2507', label: null, servedName: 'qwen', baseUrl: 'http://localhost:8003/v1',
      questionSet: { id: 'starter-v1', title: 'Starter', subset: null },
      settings: { temperature: 0, maxTokens: 2048, repeats: 1, concurrency: 1, timeoutS: 300, systemPrompt: '' },
      cases: [caseBuilder.buildCase(question, { text: 'Answer: 4', ttftMs: 40, totalMs: 900, inputTokens: 50, outputTokens: 20, finishReason: 'stop' })],
      createdAt: '2026-10-05T10:00:00.000Z',
    }, overrides));
  }

  test('eval report: a built report parses, keyed to the same model as its benchmark runs', () => {
    const parsed = parser.toEvalReport(reportFile(), 'run in panel');
    assert.ok(parsed.ok, parsed.error);
    assert.equal(parsed.data.modelKey, run().modelKey);
    assert.equal(parsed.data.cases[0].outcome, 'correct');
    assert.equal(parsed.data.cases[0].extracted, '4');
    assert.deepEqual(parsed.data.raw, reportFile());
  });

  test('eval report: a label is part of the model key, as for benchmark runs', () => {
    const parsed = parser.toEvalReport(reportFile({ label: 'fp8' }), 'file.json');
    assert.equal(parsed.data.modelKey, 'Qwen/Qwen3-4B-Instruct-2507 [fp8]');
  });

  test('eval report: a run on part of a set is filed apart from the full set, and keeps its settings', () => {
    const partial = parser.toEvalReport(reportFile({
      questionSet: { id: 'starter-v1', title: 'Starter', subset: { key: 'math-first-5', label: 'math · first 5' } },
      settings: { temperature: 0.7, maxTokens: 4096, repeats: 3, concurrency: 4, timeoutS: 120, systemPrompt: 'Be brief.' },
    }), 'run in panel').data;
    assert.equal(partial.questionSetId, 'starter-v1@math-first-5');
    assert.equal(partial.questionSetTitle, 'Starter (math · first 5)');
    assert.deepEqual(partial.settings, { temperature: 0.7, maxTokens: 4096, repeats: 3, concurrency: 4, timeoutS: 120, systemPrompt: 'Be brief.' });
  });

  test('eval report: an older report without repeats or parallel settings reads as a plain run', () => {
    const older = reportFile();
    older.settings = { temperature: 0, maxTokens: 2048 };
    delete older.questionSet.subset;
    delete older.cases[0].attempt;
    const parsed = parser.toEvalReport(older, 'old.json').data;
    assert.deepEqual([parsed.settings.repeats, parsed.settings.concurrency, parsed.settings.systemPrompt], [1, 1, '']);
    assert.equal(parsed.cases[0].attempt, 1);
    assert.equal(parsed.subset, null);
  });

  test('eval report: broken reports are rejected; other JSON is left for the other parsers', () => {
    assert.equal(parser.parseEvalReportText('{"model_id": "x"}', 'bench.json'), null);
    assert.equal(parser.parseEvalReportText('not json', 'notes.txt'), null);
    const noCases = parser.parseEvalReportText(JSON.stringify(reportFile({ cases: [] })), 'r.json');
    assert.ok(!noCases.ok && /no cases/.test(noCases.error));
    const badOutcome = reportFile();
    badOutcome.cases[0].outcome = 'maybe';
    assert.ok(!parser.toEvalReport(badOutcome, 'r.json').ok);
  });

  test('eval report: a workspace file round-trips reports alongside runs', () => {
    const report = parser.toEvalReport(reportFile(), 'run in panel').data;
    const file = storage.toWorkspaceFile({ runs: [run()], evalReports: [report], profiles: {}, modelOrder: [] });
    const loaded = resultParser.parseWorkspace(JSON.parse(JSON.stringify(file)));
    assert.ok(loaded.ok, loaded.error);
    assert.equal(loaded.data.runs.length, 1);
    assert.equal(loaded.data.evalReports.length, 1);
    assert.equal(loaded.data.evalReports[0].id, report.id);
  });
})();
