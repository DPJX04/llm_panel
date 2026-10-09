/*
 * The main results table: one row per model with its accuracy, how it fails, how fast it answers one question,
 * how the run asked, and, when benchmark runs are loaded, its speed under load.
 */
BenchPanel.define('features/accuracy/QualityTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/DataTable/metricColumn', 'components/ModelTag/ModelTag',
  'features/accuracy/qualityColumn', 'features/accuracy/runSettingsText', 'utils/numberFormat',
], (dom, dataTable, metricColumn, modelTag, qualityColumn, runSettingsText, numberFormat) => {
  'use strict';

  const RATE_KEYS = ['accuracyGivenAttempted', 'incorrectRate', 'notAttemptedRate', 'formatErrorRate'];
  const SUMMARY_KEYS = ['keyFactCoverage', 'rougeL'];
  const SPEED_KEYS =['meanTtftMs', 'meanTotalMs', 'p95TotalMs', 'decodeTokensPerS', 'meanOutputTokens'];
  const PERCENT = { format: 'percent', decimals: 0 };

  function rangeText(range) {
    return range ? `${numberFormat.formatMetric(range.min, PERCENT)}–${numberFormat.formatMetric(range.max, PERCENT)}` : '—';
  }

  /** @param {{ rows: Object[], levels: { low: any, peak: any } }} props  rows from resultRows */
  function QualityTable(props) {
    const { rows, levels } = props;
    const withRepeats = rows.some((row) => row.summary.repeats > 1);
    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      { label: 'Questions', align: 'right', render: (row) => numberFormat.formatNumber(row.summary.questions, 0) },
      qualityColumn.qualityColumn('accuracy', (row) => row.summary.accuracy),
    ];
    if (withRepeats) {
      columns.push({ label: 'Range', align: 'right', title: 'Lowest and highest accuracy of a single pass through the questions. Gaps between models smaller than this are luck.',
        render: (row) => rangeText(row.summary.accuracyRange) });
    }
    columns.push(...RATE_KEYS.map((key) => qualityColumn.qualityColumn(key, (row) => row.summary[key])));
    if (rows.some((row) => row.summary.keyFactCoverage !== null)) {
      columns.push(...SUMMARY_KEYS.map((key) => qualityColumn.qualityColumn(key, (row) => row.summary[key])));
    }
    columns.push(
      ...SPEED_KEYS.map((key) => qualityColumn.qualityColumn(key, (row) => row.summary[key])),
      { label: 'No reply', align: 'right', title: 'Requests that got no reply (timeout or server error). Left out of every rate.',
        render: (row) => (row.summary.errors > 0
          ? dom.h('span', { className: 'status-flag status-flag--warning', text: `! ${row.summary.errors}` })
          : '0') });
    if (rows.some((row) => row.peakRun)) {
      columns.push(
        metricColumn.metricColumn('outputThroughput', { run: (row) => row.peakRun, label: `Output TPS @C${numberFormat.formatConcurrency(levels.peak)}` }),
        metricColumn.metricColumn('decodeTokensPerSecond', { run: (row) => row.lowRun, label: `Decode tok/s @C${numberFormat.formatConcurrency(levels.low)}` }));
    }
    columns.push(
      { label: 'Settings', title: 'How the run asked: temperature, max tokens, repeats, questions at once, system prompt.',
        render: (row) => dom.h('span', { className: 'muted', text: runSettingsText.runSettingsText(row.report.settings) }) },
      { label: 'Run', render: (row) => dom.h('span', { className: 'muted', text: row.report.createdAt.slice(0, 16).replace('T', ' ') }) });
    return dataTable.DataTable({ columns, rows, caption: 'Accuracy by model' });
  }

  return { QualityTable };
});
