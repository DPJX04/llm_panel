(function () {
  'use strict';

  const hardwareSummary = BenchPanel.require('utils/hardwareSummary');
  const { createModelProfile } = BenchPanel.require('types/benchmarkRun');

  function profile(overrides) {
    return Object.assign(createModelProfile(), overrides);
  }

  function gpu(values) {
    return Object.assign({ gpuUtilPct: null, memoryUsedGb: null, memoryUtilPct: null, powerW: null, temperatureC: null }, values);
  }

  test('hardware: GPUs combine as average utilisation, total memory and power, hottest temperature', () => {
    const summary = hardwareSummary.summarizeGpus(profile({
      gpuMemoryTotalGb: 24,
      gpus: [
        gpu({ gpuUtilPct: 90, memoryUsedGb: 20, memoryUtilPct: 80, powerW: 200, temperatureC: 60 }),
        gpu({ gpuUtilPct: 80, memoryUsedGb: 22, memoryUtilPct: 70, powerW: 180, temperatureC: 70 }),
      ],
    }));
    assert.equal(summary.gpuCount, 2);
    assert.equal(summary.gpuUtilPct, 85);
    assert.equal(summary.memoryUsedGb, 42);
    assert.equal(summary.powerW, 380);
    assert.equal(summary.temperatureC, 70);
    assert.equal(summary.capacityGb, 48);
    assert.near(summary.occupancy, 0.875);
  });

  test('hardware: memory splits into weights, KV cache, the rest, and free', () => {
    const breakdown = hardwareSummary.memoryBreakdown(profile({
      modelSizeGb: 7.6, gpuMemoryTotalGb: 24,
      gpus: [gpu({ memoryUsedGb: 21.3 })],
      kvCache: { memoryGb: 12.3, sizeTokens: null, maxModelLen: null, maxConcurrency: null },
    }));
    assert.near(breakdown.otherGb, 1.4, 1e-9);
    assert.near(breakdown.freeGb, 2.7, 1e-9);
    assert.equal(breakdown.unattributedGb, null);
  });

  test('hardware: without a KV cache figure, the rest of used memory is unattributed, not overhead', () => {
    const breakdown = hardwareSummary.memoryBreakdown(profile({ modelSizeGb: 19.6, gpus: [gpu({ memoryUsedGb: 23.2 })] }));
    assert.equal(breakdown.otherGb, null);
    assert.near(breakdown.unattributedGb, 3.6, 1e-9);
  });

  test('hardware: efficiency per GB used, per joule, and KV tokens per GB', () => {
    const efficiency = hardwareSummary.memoryEfficiency(profile({
      gpus: [gpu({ memoryUsedGb: 21.02, powerW: 205.1 })],
      kvCache: { memoryGb: 12, sizeTokens: 90000, maxModelLen: null, maxConcurrency: null },
    }), 324.4);
    assert.near(efficiency.tpsPerGb, 15.433, 0.001);
    assert.near(efficiency.tokensPerJoule, 1.5817, 0.001);
    assert.equal(efficiency.kvTokensPerGb, 7500);
  });

  test('hardware: missing numbers give blanks, never zeros', () => {
    const blank = profile({});
    assert.equal(hardwareSummary.summarizeGpus(blank).memoryUsedGb, null);
    assert.equal(hardwareSummary.memoryEfficiency(blank, 300).tpsPerGb, null);
    assert.equal(hardwareSummary.hasGpuUsage(blank), false);
    assert.equal(hardwareSummary.hasKvCache(blank), false);
  });
})();
