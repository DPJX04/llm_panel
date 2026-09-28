/* Throughput per unit of hardware: per GB of VRAM and per watt, at the peak shared concurrency level. */
BenchPanel.define('features/comparison/gpuEfficiency', ['utils/runCollection'], (runCollection) => {
  'use strict';

  function ratio(numerator, denominator) {
    return typeof numerator === 'number' && typeof denominator === 'number' && denominator > 0 ? numerator / denominator : null;
  }

  /**
   * @param {Object[]} models  from workspaceStore.getModels()
   * @param {Object[]} runs
   * @param {number|null} peakLevel
   */
  function gpuEfficiencyRows(models, runs, peakLevel) {
    return models.map((model) => {
      const run = runCollection.findRun(runs, model.key, peakLevel);
      const outputTps = run ? run.outputThroughput : null;
      return {
        model,
        outputTps,
        tpsPerGb: ratio(outputTps, model.profile.vramGb),
        tpsPerWatt: ratio(outputTps, model.profile.powerW),
      };
    });
  }

  function hasHardwareData(models) {
    return models.some((model) => model.profile.vramGb !== null || model.profile.powerW !== null || model.profile.gpuUtilPct !== null);
  }

  return { gpuEfficiencyRows, hasHardwareData };
});
