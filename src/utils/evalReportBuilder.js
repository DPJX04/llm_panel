/* Wraps the graded cases of one run in the report file format, the same shape an exported report has. */
BenchPanel.define('utils/evalReportBuilder', ['types/evalReport'], (evalReport) => {
  'use strict';

  /**
   * @param {{ modelId: string, label: string|null, servedName: string, baseUrl: string,
   *           questionSet: { id: string, title: string, subset: { key: string, label: string }|null },
   *           settings: import('../types/evalReport').RunSettings, cases: Object[], createdAt: string }} run
   */
  function buildReportFile(run) {
    const { settings } = run;
    return {
      kind: evalReport.EVAL_REPORT_KIND,
      version: evalReport.EVAL_REPORT_VERSION,
      createdAt: run.createdAt,
      model: { id: run.modelId, label: run.label, servedName: run.servedName, baseUrl: run.baseUrl },
      questionSet: { id: run.questionSet.id, title: run.questionSet.title, subset: run.questionSet.subset || null },
      settings: {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        repeats: settings.repeats,
        concurrency: settings.concurrency,
        timeoutS: settings.timeoutS,
        systemPrompt: settings.systemPrompt,
      },
      cases: run.cases,
    };
  }

  return { buildReportFile };
});
