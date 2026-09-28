/*
 * One ranking table per concurrency level. Only one number per question a reader asks
 * (throughput, per-user speed, first token, full answer, reliability); the rest is in Model detail.
 */
BenchPanel.define('features/comparison/ConcurrencyRankingSection', [
  'components/Section/Section', 'components/DataTable/DataTable', 'components/DataTable/metricColumn',
  'components/ModelTag/ModelTag', 'components/RankLabel/RankLabel', 'constants/metricCatalog', 'constants/concurrencyNotes',
  'constants/rankingRules', 'utils/numberFormat', 'features/comparison/levelLeaders',
], (section, dataTable, metricColumn, modelTag, rankLabel, metricCatalog, concurrencyNotes, rankingRules, numberFormat, levelLeaders) => {
  'use strict';

  const METRIC_KEYS = ['outputThroughput', 'tokensPerRequest', 'meanTtftMs', 'p95TtftMs', 'meanE2eMs', 'p95E2eMs', 'successRate'];

  function LevelTable(ranked) {
    const columns = [
      { label: 'Rank', render: (row) => rankLabel.RankLabel({ rank: row.rank, tied: row.tied, prefix: '' }) },
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
      footnote: `Values within ${rankingRules.TIE_TOLERANCE_LABEL} of the best are all shown as best, and models that close share a rank ("tie"): single benchmark runs vary by about that much. Success rate is compared exactly. Req/s, Total TPS and TPOT are in Model detail.`,
    }, levelLeaders.levelLeaders(props.models, props.runs, props.focusKey).map((entry) => section.SubSection({
      title: `Concurrency ${numberFormat.formatConcurrency(entry.level)}`,
      description: concurrencyNotes.noteFor(entry.level),
    }, LevelTable(entry.ranked))));
  }

  return { ConcurrencyRankingSection };
});
