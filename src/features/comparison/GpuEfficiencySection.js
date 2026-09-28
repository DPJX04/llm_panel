/* GPU efficiency table, from the hardware numbers entered in the Data tab. */
BenchPanel.define('features/comparison/GpuEfficiencySection', [
  'components/dom', 'components/Section/Section', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'constants/metricCatalog', 'utils/numberFormat', 'features/comparison/gpuEfficiency',
], (dom, section, dataTable, modelTag, metricCatalog, numberFormat, gpuEfficiency) => {
  'use strict';

  const { HIGHER, LOWER } = metricCatalog;

  function numberColumn(label, title, read, decimals, better, suffix) {
    return {
      label, title, align: 'right', better, value: read,
      render: (row) => {
        const value = read(row);
        return value === null ? numberFormat.MISSING : `${numberFormat.formatNumber(value, decimals)}${suffix || ''}`;
      },
    };
  }

  /** @param {{ models: Object[], runs: Object[], peakLevel: number|null, onEditHardware: () => void }} props */
  function GpuEfficiencySection(props) {
    const level = numberFormat.formatConcurrency(props.peakLevel);
    const options = {
      title: 'GPU efficiency',
      description: `Throughput for the hardware each model needs, at concurrency ${level}.`,
      actions: [dom.h('button', { type: 'button', className: 'button', text: 'Edit hardware details', on: { click: props.onEditHardware } })],
    };
    if (!gpuEfficiency.hasHardwareData(props.models)) {
      return section.Section(options, dom.h('p', { className: 'hint',
        text: 'Result files do not record hardware. Add VRAM, GPU utilisation and power for each model in the Data tab to compare efficiency.' }));
    }

    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      numberColumn('Model size', 'Size of the model weights on disk', (row) => row.model.profile.modelSizeGb, 1, LOWER, ' GB'),
      numberColumn('VRAM', 'GPU memory used while serving', (row) => row.model.profile.vramGb, 2, LOWER, ' GB'),
      numberColumn('GPU util', 'Average GPU utilisation during the run', (row) => row.model.profile.gpuUtilPct, 1, null, '%'),
      numberColumn('Power', 'Average GPU power draw during the run', (row) => row.model.profile.powerW, 1, LOWER, ' W'),
      numberColumn(`Output TPS at C${level}`, 'Output tokens per second at the peak level', (row) => row.outputTps, 1, HIGHER),
      numberColumn(`TPS per GB`, 'Output TPS ÷ VRAM used', (row) => row.tpsPerGb, 2, HIGHER),
      numberColumn(`Tokens per joule`, 'Output TPS ÷ power in watts: tokens generated for each joule of GPU energy', (row) => row.tpsPerWatt, 2, HIGHER),
    ];
    return section.Section({ ...options, footnote: 'GPU utilisation is shown for context only; high utilisation is expected under load.' },
      dataTable.DataTable({ columns, rows: gpuEfficiency.gpuEfficiencyRows(props.models, props.runs, props.peakLevel), caption: 'GPU efficiency' }));
  }

  return { GpuEfficiencySection };
});
