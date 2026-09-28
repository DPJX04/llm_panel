/* One row per model with everything the GPU, memory and KV cache sections show, at the peak shared level. */
BenchPanel.define('features/comparison/hardwareRows', ['utils/runCollection', 'utils/hardwareSummary'], (runCollection, hardwareSummary) => {
  'use strict';

  /**
   * @param {Object[]} models  from workspaceStore.getModels()
   * @param {Object[]} runs
   * @param {number|null} peakLevel
   */
  function hardwareRows(models, runs, peakLevel) {
    return models.map((model) => {
      const run = runCollection.findRun(runs, model.key, peakLevel);
      const outputTps = run ? run.outputThroughput : null;
      return {
        model,
        outputTps,
        gpu: hardwareSummary.summarizeGpus(model.profile),
        memory: hardwareSummary.memoryBreakdown(model.profile),
        efficiency: hardwareSummary.memoryEfficiency(model.profile, outputTps),
      };
    });
  }

  return { hardwareRows };
});
