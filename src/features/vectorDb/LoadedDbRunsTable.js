/* Every loaded database run on its own, before averaging, with the file it came from and a way to remove it. */
BenchPanel.define('features/vectorDb/LoadedDbRunsTable', [
  'components/dom', 'components/DataTable/DataTable', 'utils/dbResultSummary', 'utils/numberFormat',
], (dom, dataTable, dbResultSummary, numberFormat) => {
  'use strict';

  /** An ISO time in this computer's time zone, e.g. "2026-10-05 00:00", the same day the result file's name shows. */
  function localTime(iso) {
    if (!iso) return numberFormat.MISSING;
    const date = new Date(iso);
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  /** @param {{ results: Object[], onRemove: (entry: Object) => void }} props */
  function LoadedDbRunsTable(props) {
    const columns = [
      { label: 'Database', render: (entry) => dbResultSummary.databaseName(entry) },
      { label: 'Dataset', render: (entry) => dbResultSummary.caseShortName(entry.caseConfig) },
      { label: 'ef search', align: 'right', render: (entry) => (entry.efSearch === null ? numberFormat.MISSING : String(entry.efSearch)) },
      { label: 'QPS', align: 'right', render: (entry) => numberFormat.formatNumber(entry.qps, 1) },
      { label: 'Recall', align: 'right', render: (entry) => numberFormat.formatMetric(entry.recall, { format: 'percent', decimals: 2 }) },
      { label: 'Run', render: (entry) => localTime(entry.createdAt) },
      { label: 'Task', render: (entry) => entry.taskLabel || numberFormat.MISSING },
      { label: 'File', render: (entry) => dom.h('span', { className: 'muted', text: entry.sourceFile }) },
      { label: '', render: (entry) => dom.h('button', { type: 'button', className: 'button button--quiet', text: 'Remove',
        'aria-label': `Remove the ${dbResultSummary.databaseName(entry)} run from ${entry.sourceFile}`,
        on: { click: () => props.onRemove(entry) } }) },
    ];
    return dataTable.DataTable({ columns, rows: props.results, caption: 'Loaded database runs' });
  }

  return { LoadedDbRunsTable };
});
