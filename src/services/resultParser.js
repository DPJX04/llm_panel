/*
 * The validation gate for everything the panel reads: vLLM `bench serve` result files
 * (one run or many runs per file, in any common layout) and saved workspace files.
 * Nothing past this file sees an unchecked value.
 */
BenchPanel.define('services/resultParser', [
  'types/result', 'types/benchmarkRun', 'config/appConfig',
  'utils/errorMessage', 'utils/modelNaming', 'utils/jsonScanner', 'utils/recordFinder', 'services/evalReportParser',
], (result, benchmarkRun, appConfig, errorMessage, modelNaming, jsonScanner, recordFinder, evalReportParser) => {
  'use strict';

  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
  const REQUIRED_NUMBERS = ['completed', 'request_throughput', 'output_throughput', 'mean_ttft_ms', 'mean_tpot_ms', 'mean_e2el_ms'];

  function num(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  function nonNegative(value) {
    const n = num(value);
    return n !== null && n >= 0 ? n : null;
  }

  function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function readStats(raw, name) {
    const stats = {};
    benchmarkRun.LATENCY_STAT_KEYS.forEach((stat) => { stats[stat] = num(raw[`${stat}_${name}_ms`]); });
    if (stats.median === null) stats.median = stats.p50;
    if (stats.p50 === null) stats.p50 = stats.median;
    return stats;
  }

  /**
   * Keeps only the plain values of a record. `--save-detailed` adds per-request arrays
   * (every generated text, every token time) that would bloat the saved workspace.
   */
  function summaryFields(raw, concurrencyHint) {
    const summary = {};
    Object.keys(raw).forEach((key) => {
      if (typeof raw[key] !== 'object' || raw[key] === null) summary[key] = raw[key];
    });
    if ((summary.max_concurrency === null || summary.max_concurrency === undefined) && concurrencyHint) {
      summary.max_concurrency = concurrencyHint;
    }
    return summary;
  }

  /**
   * @param {unknown} input
   * @param {string} sourceFile
   * @param {number|null} [concurrencyHint]  used when the record does not state its own max_concurrency
   * @returns {import('../types/result').Result<import('../types/benchmarkRun').BenchmarkRun>}
   */
  function toRun(input, sourceFile, concurrencyHint) {
    if (!isPlainObject(input)) return result.fail('record is not a JSON object');
    const raw = summaryFields(input, concurrencyHint);
    const missing = REQUIRED_NUMBERS.filter((field) => num(raw[field]) === null);
    if (typeof raw.model_id !== 'string' || raw.model_id.trim() === '') missing.unshift('model_id');
    if (missing.length > 0) return result.fail(`missing ${missing.join(', ')}`);

    const concurrency = raw.max_concurrency === null || raw.max_concurrency === undefined ? null : num(raw.max_concurrency);
    if (concurrency !== null && concurrency <= 0) return result.fail('max_concurrency must be positive');

    const modelId = raw.model_id.trim();
    const label = typeof raw.label === 'string' && raw.label.trim() !== '' ? raw.label.trim() : null;
    const modelKey = modelNaming.modelKeyFor(modelId, label);
    const date = typeof raw.date === 'string' ? raw.date : '';
    const failed = nonNegative(raw.failed) || 0;

    return result.ok({
      id: `${modelKey}@@${concurrency}@@${date}`,
      modelKey,
      modelId,
      label,
      concurrency,
      date,
      sourceFile,
      numPrompts: nonNegative(raw.num_prompts) || raw.completed + failed,
      completed: raw.completed,
      failed,
      durationS: nonNegative(raw.duration),
      totalInputTokens: nonNegative(raw.total_input_tokens),
      totalOutputTokens: nonNegative(raw.total_output_tokens),
      requestThroughput: raw.request_throughput,
      outputThroughput: raw.output_throughput,
      totalTokenThroughput: num(raw.total_token_throughput),
      peakOutputTokensPerS: num(raw.max_output_tokens_per_s),
      ttft: readStats(raw, 'ttft'),
      tpot: readStats(raw, 'tpot'),
      itl: readStats(raw, 'itl'),
      e2el: readStats(raw, 'e2el'),
      raw,
    });
  }

  /**
   * Every JSON value the text holds: one document, fenced blocks in Markdown,
   * or several values back to back (one per line, pretty-printed, glued, or comma separated).
   */
  function readJsonValues(text) {
    const trimmed = text.replace(BYTE_ORDER_MARK, '').trim();
    if (trimmed === '') throw new Error('File is empty');
    try {
      return [JSON.parse(trimmed)];
    } catch (wholeFileError) {
      const fenced = Array.from(trimmed.matchAll(/```(?:json)?\s*\n([\s\S]*?)```/g), (match) => match[1].trim());
      let chunks;
      try {
        chunks = (fenced.length > 0 ? fenced : [trimmed]).flatMap(jsonScanner.splitJsonValues);
      } catch (scanError) {
        throw fenced.length > 0 ? scanError : wholeFileError;
      }
      if (chunks.length < 2 && fenced.length === 0) throw wholeFileError;
      return chunks.map((chunk) => JSON.parse(chunk));
    }
  }

  function percent(value) {
    const n = nonNegative(value);
    return n !== null && n <= 100 ? n : null;
  }

  function toGpuUsage(raw) {
    const gpu = benchmarkRun.createGpuUsage();
    if (!isPlainObject(raw)) return gpu;
    const temperature = num(raw.temperatureC);
    gpu.gpuUtilPct = percent(raw.gpuUtilPct);
    gpu.memoryUsedGb = nonNegative(raw.memoryUsedGb);
    gpu.memoryUtilPct = percent(raw.memoryUtilPct);
    gpu.powerW = nonNegative(raw.powerW);
    gpu.temperatureC = temperature !== null && temperature > -40 && temperature < 150 ? temperature : null;
    return gpu;
  }

  function toKvCache(raw) {
    const kvCache = benchmarkRun.createKvCacheStats();
    if (!isPlainObject(raw)) return kvCache;
    benchmarkRun.KV_CACHE_FIELDS.forEach((field) => { kvCache[field] = nonNegative(raw[field]); });
    return kvCache;
  }

  /** Cleans a model profile from a workspace file or a user edit. Also reads the older one-GPU profile shape. */
  function toProfile(raw) {
    const profile = benchmarkRun.createModelProfile();
    if (!isPlainObject(raw)) return profile;
    if (typeof raw.shortName === 'string') profile.shortName = raw.shortName.trim().slice(0, appConfig.maxShortNameLength);
    profile.modelSizeGb = nonNegative(raw.modelSizeGb);
    profile.gpuMemoryTotalGb = nonNegative(raw.gpuMemoryTotalGb);
    if (Array.isArray(raw.gpus) && raw.gpus.length > 0) {
      profile.gpus = raw.gpus.slice(0, benchmarkRun.MAX_GPUS).map(toGpuUsage);
    } else if ('vramGb' in raw || 'gpuUtilPct' in raw || 'powerW' in raw) {
      profile.gpus = [toGpuUsage({ memoryUsedGb: raw.vramGb, gpuUtilPct: raw.gpuUtilPct, powerW: raw.powerW })];
    }
    profile.kvCache = toKvCache(raw.kvCache);
    return profile;
  }

  function isWorkspace(value) {
    return isPlainObject(value) && value.kind === appConfig.workspaceFileKind;
  }

  /**
   * @returns {import('../types/result').Result<{ runs: Object[], profiles: Object, modelOrder: string[], evalReports: Object[],
   *   warnings: string[] }>}
   */
  function parseWorkspace(value) {
    if (!isWorkspace(value) || !Array.isArray(value.records)) return result.fail('Not a Benchmark Panel workspace file');
    const runs = [];
    const warnings = [];
    value.records.forEach((record, index) => {
      const sourceFile = isPlainObject(record) && typeof record.sourceFile === 'string' ? record.sourceFile : 'workspace';
      const run = toRun(isPlainObject(record) ? record.data : null, sourceFile);
      if (run.ok) runs.push(run.data);
      else warnings.push(`Workspace record ${index + 1}: ${run.error}`);
    });
    const profiles = {};
    if (isPlainObject(value.profiles)) {
      Object.keys(value.profiles).forEach((key) => { profiles[key] = toProfile(value.profiles[key]); });
    }
    const modelOrder = Array.isArray(value.modelOrder) ? value.modelOrder.filter((key) => typeof key === 'string') : [];
    const evalReports = [];
    (Array.isArray(value.evalReports) ? value.evalReports : []).forEach((record, index) => {
      const sourceFile = isPlainObject(record) && typeof record.sourceFile === 'string' ? record.sourceFile : 'workspace';
      const report = evalReportParser.toEvalReport(isPlainObject(record) ? record.data : null, sourceFile);
      if (report.ok) evalReports.push(report.data);
      else warnings.push(`Workspace evaluation report ${index + 1}: ${report.error}`);
    });
    return result.ok({ runs, profiles, modelOrder, evalReports, warnings });
  }

  /**
   * @param {string} text
   * @param {string} fileName
   * @returns {import('../types/result').Result<{ runs: Object[], workspace: Object|null, warnings: string[] }>}
   */
  function parseResultText(text, fileName) {
    let values;
    try {
      values = readJsonValues(text);
    } catch (cause) {
      return result.fail(`${fileName}: ${errorMessage.toErrorMessage(cause)}`);
    }

    if (values.length === 1 && isWorkspace(values[0])) {
      const workspace = parseWorkspace(values[0]);
      if (!workspace.ok) return result.fail(`${fileName}: ${workspace.error}`);
      return result.ok({ runs: [], workspace: workspace.data, warnings: workspace.data.warnings.map((w) => `${fileName}: ${w}`) });
    }

    const records = values.flatMap(recordFinder.findRunRecords);
    const runs = [];
    const warnings = [];
    records.forEach(({ record, concurrencyHint }, index) => {
      const run = toRun(record, fileName, concurrencyHint);
      if (run.ok) runs.push(run.data);
      else warnings.push(`${fileName}${records.length > 1 ? ` record ${index + 1}` : ''}: ${run.error}`);
    });
    if (runs.length === 0) return result.fail(warnings[0] || `${fileName}: no benchmark results found`);
    return result.ok({ runs, workspace: null, warnings });
  }

  return { parseResultText, parseWorkspace, toProfile };
});
