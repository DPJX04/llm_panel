(function () {
  'use strict';

  const gpuTableParser = BenchPanel.require('services/gpuTableParser');

  test('gpu table: reads the markdown layout, one GPU', () => {
    const text = [
      '| Metric | GPU 1 |',
      '|---|---|',
      '| Average GPU utilization | 95.7% |',
      '| Average memory used | 21.30 GB |',
      '| Average memory utilization | 93.6% |',
      '| Average power | 223.9 W |',
      '| Average temperature | 67.3°C |',
    ].join('\n');
    const parsed = gpuTableParser.parseGpuUsageTable(text);
    assert.ok(parsed.ok, parsed.error);
    assert.deepEqual(parsed.data, [{ gpuUtilPct: 95.7, memoryUsedGb: 21.3, memoryUtilPct: 93.6, powerW: 223.9, temperatureC: 67.3 }]);
  });

  test('gpu table: tab-separated with two GPUs, skipping a total column and converting MiB', () => {
    const text = [
      'Metric\tGPU 1\tGPU 2\tTotal',
      'Average GPU utilization\t90%\t80%\t85%',
      'Average memory used\t20480 MiB\t10240 MiB\t30720 MiB',
      'Average power\t200 W\t150 W\t350 W',
    ].join('\n');
    const gpus = gpuTableParser.parseGpuUsageTable(text).data;
    assert.equal(gpus.length, 2);
    assert.equal(gpus[0].memoryUsedGb, 20);
    assert.equal(gpus[1].gpuUtilPct, 80);
    assert.equal(gpus[1].powerW, 150);
  });

  test('gpu table: memory utilization is not mistaken for GPU utilization', () => {
    const gpus = gpuTableParser.parseGpuUsageTable('Average memory utilization  93.6%\nAverage GPU utilization  95.7%').data;
    assert.equal(gpus[0].memoryUtilPct, 93.6);
    assert.equal(gpus[0].gpuUtilPct, 95.7);
  });

  test('gpu table: text with no known rows is rejected', () => {
    assert.equal(gpuTableParser.parseGpuUsageTable('a | b\nc | d').ok, false);
  });
})();
