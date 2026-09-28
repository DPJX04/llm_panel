/*
 * Reads a pasted GPU usage table, one metric per row and one GPU per column:
 *
 *   | Metric                      | GPU 1    | GPU 2    |
 *   | Average GPU utilization     | 95.7%    | 94.1%    |
 *   | Average memory used         | 21.30 GB | 21.28 GB |
 *
 * Markdown pipes, tabs (copied from a rendered table) and runs of spaces all work.
 */
BenchPanel.define('services/gpuTableParser', ['types/result', 'types/benchmarkRun'], (result, benchmarkRun) => {
  'use strict';

  /** Row label → GpuUsage field. Checked in order; the first match wins. */
  const ROW_FIELDS = [
    { field: 'temperatureC', pattern: /temp/i },
    { field: 'powerW', pattern: /power|watt/i },
    { field: 'memoryUtilPct', pattern: /mem\w*\s+util/i },
    { field: 'memoryUsedGb', pattern: /mem\w*\s+(used|usage)|vram/i },
    { field: 'gpuUtilPct', pattern: /util/i },
  ];

  const SUMMARY_COLUMN = /^(total|avg|average|sum|all)\b/i;

  function splitCells(line) {
    if (line.includes('|')) return line.split('|').map((cell) => cell.trim()).filter((cell, index, cells) => !(cell === '' && (index === 0 || index === cells.length - 1)));
    if (line.includes('\t')) return line.split('\t').map((cell) => cell.trim());
    return line.trim().split(/\s{2,}/);
  }

  /** "21.30 GB" → 21.3, "21800 MiB" → 21.29, "95.7%" → 95.7, "67.3°C" → 67.3 */
  function readValue(cell) {
    const match = /(-?[\d.,]+)\s*([a-z%°]*)/i.exec(cell);
    if (!match) return null;
    const value = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(value)) return null;
    return /^(mib|mb)$/i.test(match[2]) ? value / 1024 : value;
  }

  /**
   * @param {string} text
   * @returns {import('../types/result').Result<import('../types/benchmarkRun').GpuUsage[]>}
   */
  function parseGpuUsageTable(text) {
    const rows = text.split(/\r?\n/)
      .map(splitCells)
      .filter((cells) => cells.length >= 2 && !cells.every((cell) => /^:?-{2,}:?$/.test(cell) || cell === ''));

    const header = rows.find((cells) => cells.slice(1).some((cell) => /gpu\s*\d+/i.test(cell)));
    const skipColumns = new Set();
    if (header) header.forEach((cell, index) => { if (index > 0 && SUMMARY_COLUMN.test(cell)) skipColumns.add(index); });

    const gpus = [];
    let recognised = 0;
    rows.forEach((cells) => {
      if (cells === header) return;
      const spec = ROW_FIELDS.find((candidate) => candidate.pattern.test(cells[0]));
      if (!spec) return;
      recognised += 1;
      let gpuIndex = 0;
      cells.slice(1).forEach((cell, offset) => {
        if (skipColumns.has(offset + 1)) return;
        if (gpuIndex >= benchmarkRun.MAX_GPUS) return;
        if (!gpus[gpuIndex]) gpus[gpuIndex] = benchmarkRun.createGpuUsage();
        gpus[gpuIndex][spec.field] = readValue(cell);
        gpuIndex += 1;
      });
    });

    if (recognised === 0) {
      return result.fail('No GPU rows recognised. Rows should be named like "Average GPU utilization", "Average memory used", "Average power".');
    }
    return result.ok(gpus);
  }

  return { parseGpuUsageTable };
});
