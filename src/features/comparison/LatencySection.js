/*
 * Latency and stability: at each level, who is fastest, who is next, and who is the main concern.
 * Covers the average wait for the first token and the P95 end-to-end time (the slowest users).
 */
BenchPanel.define('features/comparison/LatencySection', [
  'components/dom', 'components/Section/Section', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'constants/metricCatalog', 'utils/numberFormat', 'features/comparison/levelLeaders',
], (dom, section, dataTable, modelTag, metricCatalog, numberFormat, levelLeaders) => {
  'use strict';

  const LATENCY_KEYS = ['meanTtftMs', 'p95TtftMs', 'meanE2eMs', 'p95E2eMs'];

  function Placement(entry, metric) {
    if (!entry || entry.value === null) return numberFormat.MISSING;
    return dom.h('span', { className: 'placement' },
      modelTag.ModelTag(entry.model),
      dom.h('span', { className: 'placement__value', text: numberFormat.formatMetric(entry.value, metric) }),
      entry.tied && entry.rank === 1 ? dom.h('span', { className: 'rank-label__tie', text: 'tie', title: 'Within normal run-to-run noise of the best' }) : null);
  }

  function LeaderTable(models, runs, metricKey) {
    const metric = metricCatalog.METRICS[metricKey];
    const rows = levelLeaders.levelLeaders(models, runs, metricKey)
      .map((entry) => ({ level: entry.level, ranked: entry.ranked.filter((item) => item.value !== null) }))
      .filter((entry) => entry.ranked.length > 0);
    if (rows.length === 0) return null;

    const columns = [
      { label: 'Concurrency', align: 'right', render: (row) => numberFormat.formatConcurrency(row.level) },
      { label: 'Best', render: (row) => Placement(row.ranked[0], metric) },
      { label: 'Second-best', render: (row) => Placement(row.ranked[1], metric) },
      { label: 'Main concern', render: (row) => (row.ranked.length > 2 ? Placement(row.ranked[row.ranked.length - 1], metric) : numberFormat.MISSING) },
      { label: 'Spread', align: 'right', title: 'How many times slower the main concern is than the best',
        render: (row) => {
          const best = row.ranked[0].value;
          const worst = row.ranked[row.ranked.length - 1].value;
          return row.ranked.length > 1 && best > 0 ? `${numberFormat.formatNumber(worst / best, 2)}×` : numberFormat.MISSING;
        } },
    ];
    return section.SubSection({ title: metric.title, description: metric.description }, dataTable.DataTable({ columns, rows }));
  }

  /** @param {{ models: Object[], runs: Object[] }} props */
  function LatencySection(props) {
    return section.Section({
      title: 'Latency and stability',
      description: 'Lower is better. A large spread means one model gets much slower than the rest under the same load.',
    }, LATENCY_KEYS.map((key) => LeaderTable(props.models, props.runs, key)));
  }

  return { LatencySection };
});
