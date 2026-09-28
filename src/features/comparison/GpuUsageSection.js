/*
 * GPU usage during the benchmark, one row per model. Models on several GPUs show the combined value
 * (average, total or hottest, per metric) with each GPU listed underneath.
 */
BenchPanel.define('features/comparison/GpuUsageSection', [
  'components/dom', 'components/Section/Section', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
  'constants/hardwareFields', 'constants/metricCatalog', 'utils/hardwareSummary', 'utils/numberFormat',
  'features/comparison/hardwareColumn',
], (dom, section, dataTable, modelTag, hardwareFields, metricCatalog, hardwareSummary, numberFormat, hardwareColumn) => {
  'use strict';

  const COMBINE_LABEL = { average: 'avg', sum: 'total', hottest: 'max' };
  // Memory used is not ranked: vLLM reserves a fixed share of the GPU, so it mostly reflects that setting.
  const BETTER = { powerW: metricCatalog.LOWER };

  function perGpu(row, spec) {
    if (row.model.profile.gpus.length < 2) return null;
    return row.model.profile.gpus
      .map((gpu, index) => `GPU${index + 1} ${gpu[spec.field] === null ? '—' : numberFormat.formatNumber(gpu[spec.field], spec.decimals)}`)
      .join(' · ');
  }

  function occupancy(row) {
    const { capacityGb, occupancy: share } = row.gpu;
    return capacityGb === null || share === null ? null
      : `${numberFormat.formatNumber(share * 100, 0)}% of ${numberFormat.formatNumber(capacityGb, 0)} GB`;
  }

  /** @param {{ rows: Object[], onEditHardware: () => void }} props  rows from hardwareRows() */
  function GpuUsageSection(props) {
    const options = {
      title: 'GPU usage',
      description: 'Averages over each benchmark, as entered in the Data tab. Memory used also shows the share of GPU capacity occupied.',
      actions: [dom.h('button', { type: 'button', className: 'button', text: 'Edit GPU usage', on: { click: props.onEditHardware } })],
    };
    const withData = props.rows.filter((row) => hardwareSummary.hasGpuUsage(row.model.profile));
    if (withData.length === 0) {
      return section.Section(options, dom.h('p', { className: 'hint',
        text: 'No GPU usage entered yet. In the Data tab, paste your GPU usage table or type the numbers per GPU.' }));
    }

    const columns = [
      { label: 'Model', render: (row) => modelTag.ModelTag(row.model) },
      { label: 'GPUs', align: 'right', render: (row) => String(row.gpu.gpuCount) },
      ...hardwareFields.GPU_USAGE_ROWS.map((spec) => hardwareColumn.hardwareColumn({
        label: `${spec.shortLabel} (${COMBINE_LABEL[spec.combine]})`,
        title: spec.help || spec.label,
        read: (row) => row.gpu[spec.field],
        decimals: spec.decimals,
        unit: spec.unit,
        better: BETTER[spec.field],
        sub: (row) => (spec.field === 'memoryUsedGb' ? occupancy(row) || perGpu(row, spec) : perGpu(row, spec)),
      })),
    ];
    return section.Section(options, dataTable.DataTable({ columns, rows: withData, caption: 'GPU usage' }));
  }

  return { GpuUsageSection };
});
