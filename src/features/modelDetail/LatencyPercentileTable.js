/*
 * Tail latency: the typical request (P50) next to the slow ones (P95, P99).
 * A percentile column is left out when no run recorded it.
 */
BenchPanel.define('features/modelDetail/LatencyPercentileTable', [
  'components/DataTable/DataTable', 'utils/numberFormat',
], (dataTable, numberFormat) => {
  'use strict';

  const SPECS = [
    { metric: 'ttft', stat: 'p50', label: 'TTFT P50', format: 'ms', decimals: 0 },
    { metric: 'ttft', stat: 'p95', label: 'TTFT P95', format: 'ms', decimals: 0 },
    { metric: 'ttft', stat: 'p99', label: 'TTFT P99', format: 'ms', decimals: 0 },
    { metric: 'tpot', stat: 'p50', label: 'TPOT P50', format: 'ms', decimals: 1 },
    { metric: 'tpot', stat: 'p95', label: 'TPOT P95', format: 'ms', decimals: 1 },
    { metric: 'e2el', stat: 'p50', label: 'E2E P50', format: 'seconds', decimals: 2 },
    { metric: 'e2el', stat: 'p95', label: 'E2E P95', format: 'seconds', decimals: 2 },
    { metric: 'e2el', stat: 'p99', label: 'E2E P99', format: 'seconds', decimals: 2 },
  ];

  /** @param {{ runs: Object[] }} props */
  function LatencyPercentileTable(props) {
    const present = SPECS.filter((spec) => props.runs.some((run) => run[spec.metric][spec.stat] !== null));
    const columns = [
      { label: 'Concurrency', align: 'right', render: (run) => numberFormat.formatConcurrency(run.concurrency) },
      ...present.map((spec) => ({
        label: spec.label,
        align: 'right',
        render: (run) => numberFormat.formatMetric(run[spec.metric][spec.stat], spec),
      })),
    ];
    return dataTable.DataTable({ columns, rows: props.runs, caption: 'Latency percentiles' });
  }

  return { LatencyPercentileTable };
});
