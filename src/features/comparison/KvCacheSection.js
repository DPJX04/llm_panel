/* KV cache per model, from the vLLM startup log: how much room there is for requests in flight. */
BenchPanel.define('features/comparison/KvCacheSection', [
  'components/dom', 'components/Section/Section', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'constants/metricCatalog', 'utils/hardwareSummary', 'features/comparison/hardwareColumn',
], (dom, section, dataTable, modelTag, metricCatalog, hardwareSummary, hardwareColumn) => {
  'use strict';

  const { HIGHER } = metricCatalog;

  /** @param {{ rows: Object[], onEditHardware: () => void }} props  rows from hardwareRows() */
  function KvCacheSection(props) {
    const options = {
      title: 'KV cache',
      description: 'The KV cache holds the context of every request in flight. More cache tokens means more users or longer conversations before vLLM has to queue or pause requests.',
      actions: [dom.h('button', { type: 'button', className: 'button', text: 'Edit KV cache', on: { click: props.onEditHardware } })],
    };
    const withData = props.rows.filter((row) => hardwareSummary.hasKvCache(row.model.profile));
    if (withData.length === 0) {
      return section.Section(options, dom.h('p', { className: 'hint',
        text: 'No KV cache details yet. In the Data tab, drop the `vllm serve` log for each model, or type the numbers from its startup lines.' }));
    }

    const kv = (row) => row.model.profile.kvCache;
    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      hardwareColumn.hardwareColumn({ label: 'KV cache memory', read: (row) => kv(row).memoryGb, decimals: 2, unit: 'GB' }),
      hardwareColumn.hardwareColumn({ label: 'KV cache size', title: 'Tokens the KV cache can hold across all requests', read: (row) => kv(row).sizeTokens, decimals: 0, unit: 'tokens', better: HIGHER }),
      hardwareColumn.hardwareColumn({ label: 'Tokens per GB', title: 'KV cache tokens ÷ KV cache memory. Higher means a more compact cache (e.g. fewer KV heads or a quantised cache).', read: (row) => row.efficiency.kvTokensPerGb, decimals: 0, better: HIGHER }),
      hardwareColumn.hardwareColumn({ label: 'Max model length', read: (row) => kv(row).maxModelLen, decimals: 0, unit: 'tokens' }),
      hardwareColumn.hardwareColumn({ label: 'Max concurrency', title: 'Full-length requests that fit in the KV cache at once', read: (row) => kv(row).maxConcurrency, decimals: 2, unit: '×', better: HIGHER }),
      hardwareColumn.hardwareColumn({ label: 'Share of memory used', title: 'KV cache memory ÷ GPU memory used', read: (row) => (row.efficiency.kvShare === null ? null : row.efficiency.kvShare * 100), decimals: 0, unit: '%' }),
    ];
    return section.Section(options, dataTable.DataTable({ columns, rows: withData, caption: 'KV cache' }));
  }

  return { KvCacheSection };
});
