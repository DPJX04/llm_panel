/*
 * Reads a CSV of vector database results, one run per row, into the shape VectorDBBench writes, so the same
 * validation gate (dbResultParser) checks it and it averages and charts like a JSON result.
 *
 * Column names are matched loosely (case, spaces, _ - and brackets are ignored). Columns read:
 *   db (required) · qps · recall (0-1, or a percentage such as 99.5 or "99.5%") · ndcg
 *   p99 latency in ms ("p99_ms", "p99 latency (ms)"), or serial_latency_p99 in seconds as VectorDBBench writes it
 *   ef search under any name the JSON uses (hnsw_ef, ef_search, ef, ...) · case_id · dataset (when there is no case id)
 *   k · db_label · run_id · task_label · timestamp (Unix seconds) or date
 * Any other column is an index setting such as m or ef_construct: runs only average together when it matches.
 * Numbers are written plainly (99.5, not 99,5).
 */
BenchPanel.define('services/dbResultCsvParser', [
  'types/result', 'utils/csvParser', 'services/dbResultParser',
], (result, csvParser, dbResultParser) => {
  'use strict';

  const MS_PER_S = 1000;

  // Each role and the column names (written loosely, see normalize) that fill it.
  const COLUMNS = Object.freeze({
    db: ['db', 'database', 'dbname'],
    dbLabel: ['dblabel'],
    qps: ['qps', 'maxqps'],
    recall: ['recall'],
    ndcg: ['ndcg'],
    p99Ms: ['p99ms', 'p99latencyms', 'latencyp99ms', 'seriallatencyp99ms'],
    p99S: ['seriallatencyp99'],
    caseId: ['caseid'],
    dataset: ['dataset', 'case', 'casename'],
    k: ['k'],
    runId: ['runid'],
    taskLabel: ['tasklabel'],
    time: ['timestamp', 'date'],
  });

  /** A column name with case, spaces and punctuation removed, e.g. "P99 latency (ms)" -> "p99latencyms". */
  function normalize(header) {
    return header.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  /** The role a column fills, or null for an index setting. */
  function roleOf(header) {
    const name = normalize(header);
    return Object.keys(COLUMNS).find((role) => COLUMNS[role].includes(name)) || null;
  }

  /**
   * A plain number such as 140.24; null when the cell holds none. "140,24" or "1,026" read as no number rather than a
   * wrong one, since a comma can mean a decimal point or a thousands mark; the row then gets a warning.
   */
  function toNumber(text) {
    if (text === undefined || text.trim() === '') return null;
    const number = Number(text.trim());
    return Number.isFinite(number) ? number : null;
  }

  /** A share from 0 to 1, also read from a percentage: "99.5%" and 99.5 both become 0.995. */
  function toShare(text) {
    const number = toNumber(text === undefined ? undefined : text.replace('%', ''));
    if (number === null) return null;
    return text.includes('%') || number > 1 ? number / 100 : number;
  }

  /** Unix seconds from a number of seconds or a date such as "2026-10-05 00:00"; null when neither. */
  function toUnixSeconds(text) {
    if (text === undefined) return null;
    const seconds = toNumber(text);
    if (seconds !== null) return seconds;
    const time = Date.parse(text);
    return Number.isNaN(time) ? null : time / MS_PER_S;
  }

  /** An index setting's value: a number, true or false, or the text as written. */
  function toSetting(text) {
    const number = toNumber(text);
    if (number !== null) return number;
    if (/^(true|false)$/i.test(text)) return text.toLowerCase() === 'true';
    return text;
  }

  /** One CSV row as a VectorDBBench result file holding one result. */
  function toResultFile(headers, cells, rowName) {
    const cell = {};
    const indexConfig = {};
    headers.forEach((header, index) => {
      const text = cells[index] || '';
      if (text === '') return;
      const role = roleOf(header);
      if (role) cell[role] = text;
      else indexConfig[header.replace(/[\s-]+/g, '_')] = toSetting(text);
    });
    const p99Ms = toNumber(cell.p99Ms);
    return {
      // A row without a run id is known by its file and row, so loading the same CSV again keeps one copy.
      run_id: cell.runId || rowName,
      task_label: cell.taskLabel || '',
      timestamp: toUnixSeconds(cell.time),
      results: [{
        metrics: {
          qps: toNumber(cell.qps),
          recall: toShare(cell.recall),
          ndcg: toShare(cell.ndcg),
          serial_latency_p99: p99Ms !== null ? p99Ms / MS_PER_S : toNumber(cell.p99S),
        },
        task_config: {
          db: cell.db || '',
          db_config: { db_label: cell.dbLabel || '' },
          db_case_config: indexConfig,
          case_config: {
            case_id: toNumber(cell.caseId),
            custom_case: cell.dataset && cell.caseId === undefined ? { name: cell.dataset } : null,
            k: toNumber(cell.k),
          },
        },
        label: ':)',
      }],
    };
  }

  /**
   * Reads every row. A bad row becomes a warning; the good ones still load.
   * @returns {import('../types/result').Result<{ results: Object[], warnings: string[] }>}
   */
  function parseDbResultCsv(text, fileName) {
    const rows = csvParser.parseCsv(text);
    if (rows.length < 2) return result.fail(`${fileName}: the CSV needs a header row and at least one run`);
    const headers = rows[0];
    if (!headers.some((header) => roleOf(header) === 'db')) return result.fail(`${fileName}: no "db" column naming the database`);

    const results = [];
    const warnings = [];
    rows.slice(1).forEach((cells, index) => {
      // Each row is named by its line in the file, which is where a warning sends the reader.
      const rowName = `${fileName} row ${index + 2}`;
      const parsed = dbResultParser.toDbResults(toResultFile(headers, cells, rowName), rowName);
      if (!parsed.ok) { warnings.push(`${rowName}: ${parsed.error}`); return; }
      results.push(...parsed.data.results);
      warnings.push(...parsed.data.warnings);
    });
    return result.ok({ results, warnings });
  }

  return { parseDbResultCsv };
});
