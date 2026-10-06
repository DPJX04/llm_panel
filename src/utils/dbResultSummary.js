/*
 * Turns loaded database runs into what the Vector DB tab shows: runs with the same config become one row
 * holding their average, and the rows are grouped by test case (dataset) and ef search.
 */
BenchPanel.define('utils/dbResultSummary', ['constants/vectorDbCases'], (vectorDbCases) => {
  'use strict';

  /** The average of the numbers in the list, skipping missing values. Null when there are none. */
  function mean(values) {
    const numbers = values.filter((value) => typeof value === 'number');
    return numbers.length === 0 ? null : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  /** The database's display name, with its label when the run set one, e.g. "QdrantLocal (on disk)". */
  function databaseName(entry) {
    return entry.dbLabel ? `${entry.db} (${entry.dbLabel})` : entry.db;
  }

  /** The test case in words, e.g. "OpenAI 5M · 1536D"; a custom dataset by its name; an unknown one as "case 42". */
  function caseName(caseConfig) {
    if (caseConfig.customCase) return caseConfig.customCase;
    const known = vectorDbCases.CASES[caseConfig.caseId];
    if (!known) return caseConfig.caseId === null ? 'Unknown case' : `case ${caseConfig.caseId}`;
    return `${known.dataset} ${known.size} · ${known.dim}D${known.filter ? ` · ${known.filter} filter` : ''}`;
  }

  /** A shorter name for chart labels, e.g. "OpenAI 5M". */
  function caseShortName(caseConfig) {
    const known = caseConfig.customCase ? null : vectorDbCases.CASES[caseConfig.caseId];
    if (!known) return caseName(caseConfig);
    return `${known.dataset} ${known.size}${known.filter ? ` (${known.filter})` : ''}`;
  }

  /** Equal for rows of the same test case, so they can be grouped. */
  function caseKeyOf(row) {
    return JSON.stringify(row.caseConfig);
  }

  /** Sort order for ef search values: lowest first, a missing ef last. */
  function compareEf(a, b) {
    if (a === null) return b === null ? 0 : 1;
    if (b === null) return -1;
    return a - b;
  }

  /** The average QPS and p99 latency at each concurrency level, over the runs that measured that level. */
  function averageConcurrency(runs) {
    const levels = Array.from(new Set(runs.flatMap((run) => run.concurrencyPoints.map((point) => point.level)))).sort((a, b) => a - b);
    return levels.map((level) => {
      const points = runs.map((run) => run.concurrencyPoints.find((point) => point.level === level)).filter(Boolean);
      return { level, qps: mean(points.map((point) => point.qps)), latencyP99Ms: mean(points.map((point) => point.latencyP99Ms)) };
    });
  }

  /**
   * Merges runs that share a config (same database, settings and case) into one row with the average of each metric.
   * The config fields are copied from the first run, since every run in the row has the same ones.
   * @param {Object[]} results  validated DbResults
   * @returns {Array<{ configKey: string, seriesKey: string, name: string, db: string, dbLabel: string|null, efSearch: number|null,
   *   indexConfig: Object, caseConfig: Object, runs: number, qps: number|null, recall: number|null, ndcg: number|null,
   *   latencyP99Ms: number|null, concurrencyPoints: Object[], sourceFiles: string[] }>}
   */
  function averageByConfig(results) {
    const byConfig = new Map();
    results.forEach((entry) => {
      if (!byConfig.has(entry.configKey)) byConfig.set(entry.configKey, []);
      byConfig.get(entry.configKey).push(entry);
    });
    return Array.from(byConfig.values()).map((runs) => {
      const first = runs[0];
      return {
        configKey: first.configKey,
        seriesKey: first.seriesKey,
        name: databaseName(first),
        db: first.db,
        dbLabel: first.dbLabel,
        efSearch: first.efSearch,
        indexConfig: first.indexConfig,
        caseConfig: first.caseConfig,
        runs: runs.length,
        qps: mean(runs.map((run) => run.qps)),
        recall: mean(runs.map((run) => run.recall)),
        ndcg: mean(runs.map((run) => run.ndcg)),
        latencyP99Ms: mean(runs.map((run) => run.latencyP99Ms)),
        concurrencyPoints: averageConcurrency(runs),
        sourceFiles: Array.from(new Set(runs.map((run) => run.sourceFile))),
      };
    });
  }

  /**
   * Splits rows by test case, in the order first seen. Each case is a different dataset, so it gets its own chart.
   * @returns {Array<{ caseKey: string, caseName: string, rows: Object[] }>}
   */
  function groupByCase(rows) {
    const cases = new Map();
    rows.forEach((row) => {
      const key = caseKeyOf(row);
      if (!cases.has(key)) cases.set(key, { caseKey: key, caseName: caseName(row.caseConfig), rows: [] });
      cases.get(key).rows.push(row);
    });
    return Array.from(cases.values());
  }

  /**
   * Puts rows into one group per test case and ef search value: cases in the order first seen, then lowest ef first
   * (a missing ef last). A group never mixes datasets, since their QPS cannot be compared.
   * Inside a group the fastest row (highest QPS) comes first, numbered from 1 so the results and config tables line up.
   * @returns {Array<{ caseName: string, caseShortName: string, efSearch: number|null, rows: Object[] }>}
   */
  function groupByCaseAndEf(rows) {
    return groupByCase(rows).flatMap((entry) => {
      const efValues = Array.from(new Set(entry.rows.map((row) => row.efSearch))).sort(compareEf);
      return efValues.map((efSearch) => ({
        caseName: entry.caseName,
        caseShortName: caseShortName(entry.rows[0].caseConfig),
        efSearch,
        rows: entry.rows
          .filter((row) => row.efSearch === efSearch)
          .sort((a, b) => (b.qps || 0) - (a.qps || 0))
          .map((row, index) => ({ ...row, number: index + 1 })),
      }));
    });
  }

  return { mean, databaseName, caseName, caseShortName, caseKeyOf, compareEf, averageByConfig, groupByCase, groupByCaseAndEf };
});
