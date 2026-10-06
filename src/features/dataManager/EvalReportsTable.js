/* Every loaded accuracy report: model, question set, score and when it ran, with a way to remove it. */
BenchPanel.define('features/dataManager/EvalReportsTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag', 'utils/evalSummary', 'utils/numberFormat',
], (dom, dataTable, modelTag, evalSummary, numberFormat) => {
  'use strict';

  /** @param {{ reports: Object[], models: Object[], onRemove: (report: Object) => void }} props  models from getAllModels */
  function EvalReportsTable(props) {
    const rows = props.models.flatMap((model) => props.reports
      .filter((report) => report.modelKey === model.key)
      .map((report) => ({ report, model, summary: evalSummary.summarizeReport(report) })));

    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      { label: 'Question set', render: (row) => row.report.questionSetTitle },
      { label: 'Questions', align: 'right', render: (row) => numberFormat.formatNumber(row.summary.cases, 0) },
      { label: 'Accuracy', align: 'right', render: (row) => numberFormat.formatMetric(row.summary.accuracy, { format: 'percent', decimals: 0 }) },
      { label: 'Run', render: (row) => row.report.createdAt.slice(0, 16).replace('T', ' ') },
      { label: 'Server', render: (row) => dom.h('span', { className: 'muted', text: row.report.baseUrl || row.report.sourceFile }) },
      { label: '', render: (row) => dom.h('button', { type: 'button', className: 'button button--quiet', text: 'Remove',
        'aria-label': `Remove the ${row.report.questionSetTitle} report for ${row.model.name}`,
        on: { click: () => props.onRemove(row.report) } }) },
    ];
    return dataTable.DataTable({ columns, rows, caption: 'Accuracy reports' });
  }

  return { EvalReportsTable };
});
