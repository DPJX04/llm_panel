/*
 * Memory: where each model's GPU memory goes (weights, KV cache, the rest, free), and how much
 * throughput it delivers per GB used and per joule of energy.
 */
BenchPanel.define('features/comparison/MemorySection', [
  'components/dom', 'components/Section/Section', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'components/StackedBarList/StackedBarList', 'constants/metricCatalog', 'utils/hardwareSummary', 'utils/numberFormat',
  'features/comparison/hardwareColumn',
], (dom, section, dataTable, modelTag, stackedBarList, metricCatalog, hardwareSummary, numberFormat, hardwareColumn) => {
  'use strict';

  const { HIGHER, LOWER } = metricCatalog;

  const PARTS = [
    { key: 'weightsGb', label: 'Model weights', color: 'var(--series-1)' },
    { key: 'kvCacheGb', label: 'KV cache', color: 'var(--series-3)' },
    { key: 'otherGb', label: 'Activations and overhead', color: 'var(--series-4)' },
    { key: 'unattributedGb', label: 'Used, split unknown', color: 'var(--series-other)' },
    { key: 'freeGb', label: 'Free', color: 'var(--free-memory)' },
  ];

  function gb(value) {
    return `${numberFormat.formatNumber(value, 2)} GB`;
  }

  function barText(memory) {
    if (memory.usedGb !== null && memory.capacityGb !== null) return `${numberFormat.formatNumber(memory.usedGb, 1)} / ${numberFormat.formatNumber(memory.capacityGb, 0)} GB`;
    if (memory.usedGb !== null) return `${numberFormat.formatNumber(memory.usedGb, 1)} GB used`;
    return '';
  }

  function Breakdown(rows) {
    return stackedBarList.StackedBarList({
      parts: PARTS,
      items: rows.map((row) => ({ model: row.model, values: row.memory, valueText: barText(row.memory) })),
      formatValue: gb,
      ariaLabel: 'GPU memory breakdown per model',
    });
  }

  function EfficiencyTable(rows, peak) {
    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      hardwareColumn.hardwareColumn({ label: 'Weights', title: 'Model weights in GPU memory', read: (row) => row.memory.weightsGb, decimals: 2, unit: 'GB', better: LOWER }),
      hardwareColumn.hardwareColumn({ label: 'KV cache', title: 'Memory given to the KV cache', read: (row) => row.memory.kvCacheGb, decimals: 2, unit: 'GB' }),
      hardwareColumn.hardwareColumn({ label: 'Memory used', title: 'GPU memory used during the benchmark, all GPUs', read: (row) => row.memory.usedGb, decimals: 2, unit: 'GB' }),
      hardwareColumn.hardwareColumn({ label: `Output TPS @C${peak}`, read: (row) => row.outputTps, decimals: 1, better: HIGHER }),
      hardwareColumn.hardwareColumn({ label: 'TPS per GB', title: 'Output TPS ÷ GPU memory used', read: (row) => row.efficiency.tpsPerGb, decimals: 2, better: HIGHER }),
      hardwareColumn.hardwareColumn({ label: 'Tokens per joule', title: 'Output TPS ÷ GPU power (W): tokens generated for each joule of energy', read: (row) => row.efficiency.tokensPerJoule, decimals: 2, better: HIGHER }),
    ];
    return dataTable.DataTable({ columns, rows, caption: 'Memory efficiency' });
  }

  /** @param {{ rows: Object[], peakLevel: number|null, onEditHardware: () => void }} props  rows from hardwareRows() */
  function MemorySection(props) {
    const peak = numberFormat.formatConcurrency(props.peakLevel);
    const options = {
      title: 'Memory',
      description: 'How much GPU memory each model occupies and what it is used for, then the throughput it delivers for that memory. Hover a bar segment for its size.',
      actions: [dom.h('button', { type: 'button', className: 'button', text: 'Edit memory details', on: { click: props.onEditHardware } })],
      footnote: 'Weights and KV cache come from the vLLM startup log. "Activations and overhead" is memory used minus both. vLLM reserves most of the GPU up front (--gpu-memory-utilization), so memory used mainly reflects that setting; the split between weights and KV cache is what differs between models.',
    };
    const withData = props.rows.filter((row) => hardwareSummary.hasMemoryData(row.model.profile));
    if (withData.length === 0) {
      return section.Section(options, dom.h('p', { className: 'hint',
        text: 'No memory details yet. In the Data tab, drop the vLLM server log for each model, or type weights, KV cache and memory used.' }));
    }
    return section.Section(options,
      Breakdown(withData),
      dom.h('div', { className: 'memory-section__table' }, EfficiencyTable(withData, peak)));
  }

  return { MemorySection };
});
