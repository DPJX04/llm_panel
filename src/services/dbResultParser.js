/*
 * The validation gate for vector database results: VectorDBBench result files a user loads, and the runs saved
 * in the workspace. Nothing past this file sees an unchecked value.
 */
BenchPanel.define('services/dbResultParser', ['types/result', 'types/dbResult'], (result, dbResult) => {
  'use strict';

  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
  const MS_PER_S = 1000;

  function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function positiveWhole(value) {
    return Number.isInteger(value) && value >= 1 ? value : null;
  }

  /** A measured value, or null. VectorDBBench writes 0 for a stage that did not run, so 0 counts as not measured. */
  function measured(value) {
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
  }

  /** A measured score from 0 to 1 (recall, NDCG), or null. */
  function measuredShare(value) {
    const number = measured(value);
    return number !== null && number <= 1 ? number : null;
  }

  /** Unix seconds as an ISO time; '' when missing or out of range. */
  function toIsoTime(seconds) {
    const date = new Date(seconds === null ? NaN : seconds * MS_PER_S);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }

  /** Keeps a config's plain values (text, numbers, true/false), keys sorted so equal configs always give equal keys. */
  function scalarFields(raw) {
    const fields = {};
    if (!isPlainObject(raw)) return fields;
    Object.keys(raw).sort().forEach((key) => {
      const value = raw[key];
      const isScalar = typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value));
      if (isScalar) fields[key] = value;
    });
    return fields;
  }

  /** The field an index config uses for the search-time ef, whatever the database calls it (hnsw_ef, ef_search, ef, ...). Null when absent. */
  function efSearchKeyOf(indexConfig) {
    return Object.keys(indexConfig).find((name) => dbResult.EF_SEARCH_KEYS.includes(name.toLowerCase().replace(/_/g, ''))) || null;
  }

  /** The index config without one field, e.g. without ef search so runs that differ only in ef are drawn as one line. */
  function withoutField(config, field) {
    const rest = { ...config };
    if (field !== null) delete rest[field];
    return rest;
  }

  /** QPS and p99 latency at each concurrency level, read from the side-by-side lists VectorDBBench writes. */
  function toConcurrencyPoints(metrics) {
    const levels = Array.isArray(metrics.conc_num_list) ? metrics.conc_num_list : [];
    const qps = Array.isArray(metrics.conc_qps_list) ? metrics.conc_qps_list : [];
    const p99S = Array.isArray(metrics.conc_latency_p99_list) ? metrics.conc_latency_p99_list : [];
    return levels
      .map((level, index) => ({
        level: positiveWhole(level),
        qps: measured(qps[index]),
        latencyP99Ms: measured(p99S[index]) === null ? null : p99S[index] * MS_PER_S,
      }))
      .filter((point) => point.level !== null && (point.qps !== null || point.latencyP99Ms !== null));
  }

  /** The test case: which dataset, how many neighbours, and the concurrency levels searched at. */
  function toCaseConfig(raw) {
    const config = isPlainObject(raw) ? raw : {};
    const search = isPlainObject(config.concurrency_search_config) ? config.concurrency_search_config : {};
    const custom = isPlainObject(config.custom_case) ? config.custom_case : {};
    return {
      caseId: positiveWhole(config.case_id),
      customCase: text(custom.name) || null,
      k: positiveWhole(config.k),
      concurrency: Array.isArray(search.num_concurrency) ? search.num_concurrency.filter((level) => positiveWhole(level) !== null) : [],
    };
  }

  /** True for the shape VectorDBBench writes: { run_id, results: [{ metrics, task_config: { db, ... } }] }. */
  function isDbResultFile(value) {
    return isPlainObject(value) && Array.isArray(value.results) && value.results.some((entry) =>
      isPlainObject(entry) && isPlainObject(entry.task_config) && typeof entry.task_config.db === 'string');
  }

  /**
   * Cleans one entry of a result file's "results" list.
   * @param {unknown} entry
   * @param {{ runId: string, taskLabel: string, timestamp: number|null }} run  what the file states once for all its entries
   * @param {string} sourceFile
   * @returns {import('../types/result').Result<import('../types/dbResult').DbResult>}
   */
  function toDbResult(entry, run, sourceFile) {
    if (!isPlainObject(entry)) return result.fail('entry is not a JSON object');
    const metrics = isPlainObject(entry.metrics) ? entry.metrics : {};
    const task = isPlainObject(entry.task_config) ? entry.task_config : {};
    const dbConfig = isPlainObject(task.db_config) ? task.db_config : {};
    const db = text(task.db);
    if (db === '') return result.fail('the entry does not name its database');
    if (Object.prototype.hasOwnProperty.call(dbResult.FAILED_LABELS, entry.label)) return result.fail(`${db}: ${dbResult.FAILED_LABELS[entry.label]}`);

    const qps = measured(metrics.qps);
    const recall = measuredShare(metrics.recall);
    if (qps === null && recall === null) return result.fail(`${db}: no search results (qps and recall are missing or 0)`);

    const dbLabel = text(dbConfig.db_label) || null;
    const indexConfig = scalarFields(task.db_case_config);
    const caseConfig = toCaseConfig(task.case_config);
    const efSearchKey = efSearchKeyOf(indexConfig);
    const configKey = JSON.stringify({ db, dbLabel, indexConfig, caseConfig });
    const latencyP99S = measured(metrics.serial_latency_p99);

    return result.ok({
      // Without a run id, the file name and time stand in, so loading the same file twice still keeps one copy.
      id: `${run.runId || `${sourceFile}@@${run.timestamp}`}@@${configKey}`,
      configKey,
      // The database setup without ef search and test case, so it keeps one name and colour across every ef and dataset.
      seriesKey: JSON.stringify({ db, dbLabel, indexConfig: withoutField(indexConfig, efSearchKey) }),
      runId: run.runId,
      db,
      dbLabel,
      efSearch: efSearchKey === null ? null : positiveWhole(indexConfig[efSearchKey]),
      indexConfig,
      caseConfig,
      qps,
      recall,
      ndcg: measuredShare(metrics.ndcg),
      latencyP99Ms: latencyP99S === null ? null : latencyP99S * MS_PER_S,
      concurrencyPoints: toConcurrencyPoints(metrics),
      taskLabel: run.taskLabel,
      createdAt: toIsoTime(run.timestamp),
      sourceFile,
      // Only the fields read above are saved; db_config is left out because it can hold a server address or password.
      raw: {
        run_id: run.runId,
        task_label: run.taskLabel,
        timestamp: run.timestamp,
        results: [{
          metrics: {
            qps: metrics.qps, recall: metrics.recall, ndcg: metrics.ndcg, serial_latency_p99: metrics.serial_latency_p99,
            conc_num_list: metrics.conc_num_list, conc_qps_list: metrics.conc_qps_list, conc_latency_p99_list: metrics.conc_latency_p99_list,
          },
          task_config: { db, db_config: { db_label: dbLabel || '' }, db_case_config: indexConfig, case_config: task.case_config },
          label: entry.label,
        }],
      },
    });
  }

  /**
   * Cleans every entry of a parsed result file. A bad entry becomes a warning; the good ones still load.
   * @param {unknown} value
   * @param {string} sourceFile
   * @returns {import('../types/result').Result<{ results: Object[], warnings: string[] }>}
   */
  function toDbResults(value, sourceFile) {
    if (!isDbResultFile(value)) return result.fail('Not a VectorDBBench result file');
    const run = { runId: text(value.run_id), taskLabel: text(value.task_label), timestamp: measured(value.timestamp) };
    const results = [];
    const warnings = [];
    value.results.forEach((entry, index) => {
      const parsed = toDbResult(entry, run, sourceFile);
      if (parsed.ok) results.push(parsed.data);
      else warnings.push(`${sourceFile}${value.results.length > 1 ? ` entry ${index + 1}` : ''}: ${parsed.error}`);
    });
    return result.ok({ results, warnings });
  }

  /**
   * Reads a file's text as a VectorDBBench result.
   * @returns {import('../types/result').Result<{ results: Object[], warnings: string[] }>|null}
   *   null when the text is not a VectorDBBench result file, so the caller can try other formats
   */
  function parseDbResultText(rawText, fileName) {
    let value;
    try {
      value = JSON.parse(String(rawText).replace(BYTE_ORDER_MARK, ''));
    } catch (cause) {
      return null;
    }
    return isDbResultFile(value) ? toDbResults(value, fileName) : null;
  }

  return { isDbResultFile, toDbResults, parseDbResultText };
});
