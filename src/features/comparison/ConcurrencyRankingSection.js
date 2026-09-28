/* One ranking table per concurrency level, every headline metric side by side. */
BenchPanel.define('features/comparison/ConcurrencyRankingSection', [
  'components/dom', 'components/Section/Section', 'components/DataTable/DataTable', 'components/DataTable/metricColumn',
  'components/ModelTag/ModelTag', 'constants/metricCatalog', 'constants/concurrencyNotes', 'utils/numberFormat',
  'features/comparison/levelLeaders',
], (dom, section, dataTable, metricColumn, modelTag, metricCatalog, concurrencyNotes, numberFormat, levelLeaders) => {
  'use strict';

  const METRIC_KEYS = [
    'requestThroughput', 'outputThroughput', 'totalTokenThroughput', 'tokensPerRequest',
    'meanTtftMs', 'p95TtftMs', 'meanTpotMs', 'meanE2eMs', 'p95E2eMs', 'successRate',
  ];

  function LevelTable(ranked) {
    const columns = [
      { label: 'Rank', align: 'right', render: (row) => (row.rank === null ? numberFormat.MISSING : String(row.rank)) },
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      ...METRIC_KEYS
        .map((key) => metricColumn.metricColumn(key, { run: (row) => row.run, baseline: (row) => row.baseline }))
        .filter((column) => ranked.some((row) => column.value(row) !== null)),
    ];
    return dataTable.DataTable({ columns, rows: ranked, rowClass: (row) => (row.rank === 1 ? 'is-leader' : '') });
  }

  /** @param {{ models: Object[], runs: Object[], focusKey: string }} props */
  function ConcurrencyRankingSection(props) {
    const focus = metricCatalog.METRICS[props.focusKey];
    return section.Section({
      title: 'Ranking at each concurrency level',
      description: `Models ranked by ${focus.title.toLowerCase()}. The best value in every column is bold; hover a column header for what it means.`,
    }, levelLeaders.levelLeaders(props.models, props.runs, props.focusKey).map((entry) => section.SubSection({
      title: `Concurrency ${numberFormat.formatConcurrency(entry.level)}`,
      description: concurrencyNotes.noteFor(entry.level),
    }, LevelTable(entry.ranked))));
  }

  return { ConcurrencyRankingSection };
});
