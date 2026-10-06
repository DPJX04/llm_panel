/**
 * One vector database benchmark run: a single entry of a VectorDBBench result file
 * (one database, one index and search setting, one test case).
 *
 * @typedef {Object} DbCaseConfig
 * @property {number|null} caseId      VectorDBBench case, e.g. 11 for 5M vectors of 1536 dimensions
 * @property {string|null} customCase  the custom dataset's name, when the case is a custom one
 * @property {number|null} k           neighbours asked for per query
 * @property {number[]} concurrency    the concurrency levels searched at
 *
 * @typedef {Object} ConcurrencyPoint
 * @property {number} level              queries sent at once
 * @property {number|null} qps
 * @property {number|null} latencyP99Ms
 *
 * @typedef {Object} DbResult
 * @property {string} id               run id plus config key, so loading the same file twice keeps one copy
 * @property {string} configKey        equal for runs of the same database, settings and case; those runs are averaged
 * @property {string} seriesKey        the database setup without ef search and test case: one name and colour in every chart
 * @property {string} runId
 * @property {string} db               e.g. "QdrantLocal"
 * @property {string|null} dbLabel
 * @property {number|null} efSearch    the search-time ef (hnsw_ef, ef_search, ...); null when the config has none
 * @property {Object<string, string|number|boolean>} indexConfig  db_case_config as written, keys sorted
 * @property {DbCaseConfig} caseConfig
 * @property {number|null} qps         best QPS over the concurrency levels; null when the concurrent search did not run
 * @property {number|null} recall      0..1; null when the serial search did not run (a run has at least one of the two)
 * @property {number|null} ndcg        0..1
 * @property {number|null} latencyP99Ms  serial (one query at a time) p99 latency
 * @property {ConcurrencyPoint[]} concurrencyPoints  one per concurrency level searched, lowest first
 * @property {string} taskLabel
 * @property {string} createdAt        ISO time of the run; '' when the file has none
 * @property {string} sourceFile
 * @property {Object} raw              the entry as saved, so a reload re-runs the same validation
 */
BenchPanel.define('types/dbResult', [], () => {
  'use strict';

  // Names databases use for the search-time ef, written lower case without underscores (so "efSearch" matches "efsearch").
  const EF_SEARCH_KEYS = Object.freeze(['efsearch', 'hnswef', 'ef', 'efruntime']);

  // VectorDBBench marks each result: ":)" ran normally, "x" failed, "?" fell outside the allowed range.
  const FAILED_LABELS = Object.freeze({ x: 'the run failed', '?': 'the run was out of range' });

  return { EF_SEARCH_KEYS, FAILED_LABELS };
});
