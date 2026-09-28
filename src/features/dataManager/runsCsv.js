/* Flattens the loaded runs into one CSV row each, derived metrics included, for Excel. */
BenchPanel.define('features/dataManager/runsCsv', [
  'utils/csvBuilder', 'utils/metricValues', 'utils/runCollection',
], (csvBuilder, metricValues, runCollection) => {
  'use strict';

  const HEADERS = [
    'Model', 'Model ID', 'Label', 'Concurrency', 'Req/s', 'Output TPS', 'Total TPS', 'Tok/s per request',
    'Mean TTFT (ms)', 'P95 TTFT (ms)', 'Mean TPOT (ms)', 'P95 TPOT (ms)', 'Mean E2E (ms)', 'P95 E2E (ms)',
    'Scaling efficiency', 'Speed retained', 'Success rate', 'Prompts', 'Failed',
    'Avg input tokens', 'Avg output tokens', 'Duration (s)', 'Run date', 'Source file',
  ];

  const METRIC_KEYS = [
    'requestThroughput', 'outputThroughput', 'totalTokenThroughput', 'tokensPerRequest',
    'meanTtftMs', 'p95TtftMs', 'meanTpotMs', 'p95TpotMs', 'meanE2eMs', 'p95E2eMs',
    'scalingEfficiency', 'speedRetention', 'successRate',
  ];

  function round(value) {
    return typeof value === 'number' ? Math.round(value * 1000) / 1000 : null;
  }

  function perRequest(total, count) {
    return typeof total === 'number' && count > 0 ? round(total / count) : null;
  }

  /** @param {Object[]} models  from workspaceStore.getModels(), in display order */
  function buildRunsCsv(runs, models) {
    const rows = models.flatMap((model) => {
      const modelRuns = runCollection.runsForModel(runs, model.key);
      const baseline = modelRuns[0];
      return modelRuns.map((run) => [
        model.name, run.modelId, run.label, run.concurrency,
        ...METRIC_KEYS.map((key) => round(metricValues.getMetricValue(run, key, baseline))),
        run.numPrompts, run.failed,
        perRequest(run.totalInputTokens, run.completed), perRequest(run.totalOutputTokens, run.completed),
        round(run.durationS), run.date, run.sourceFile,
      ]);
    });
    return csvBuilder.toCsv(HEADERS, rows);
  }

  return { buildRunsCsv };
});
