/* The config behind each row of one card. Row numbers match the QPS and recall table above it. */
BenchPanel.define('features/vectorDb/ConfigTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag', 'utils/dbResultSummary', 'utils/numberFormat',
], (dom, dataTable, modelTag, dbResultSummary, numberFormat) => {
  'use strict';

  /** A config's fields as one line, e.g. "ef_construct=100 · m=16 · metric_type=COSINE". */
  function fieldsText(config) {
    const pairs = Object.keys(config).map((key) => `${key}=${config[key]}`);
    return pairs.length > 0 ? pairs.join(' · ') : numberFormat.MISSING;
  }

  /** The dataset and how many neighbours each query asked for, e.g. "OpenAI 5M · 1536D · k=10". */
  function caseText(caseConfig) {
    const name = dbResultSummary.caseName(caseConfig);
    return caseConfig.k === null ? name : `${name} · k=${caseConfig.k}`;
  }

  /** @param {{ rows: Object[] }} props  the same rows as the QPS and recall table */
  function ConfigTable(props) {
    const columns = [
      { label: '#', align: 'right', render: (row) => String(row.number) },
      { label: 'Database', render: (row) => modelTag.ModelTag(row) },
      { label: 'Index config', title: 'db_case_config from the result file',
        render: (row) => dom.h('span', { className: 'vector-db-config', text: fieldsText(row.indexConfig) }) },
      { label: 'Case', title: 'VectorDBBench case id (or custom dataset) and k, the neighbours asked for per query',
        render: (row) => caseText(row.caseConfig) },
      { label: 'Concurrency', title: 'The concurrency levels searched at; QPS is the best of them',
        render: (row) => row.caseConfig.concurrency.join(', ') || numberFormat.MISSING },
      { label: 'Files', title: 'The result files averaged into this row',
        render: (row) => dom.h('span', { className: 'vector-db-config muted', text: row.sourceFiles.join(', ') }) },
    ];
    return dataTable.DataTable({ columns, rows: props.rows, caption: 'Config' });
  }

  return { ConfigTable };
});
