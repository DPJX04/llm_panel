/*
 * GPU usage for one model in the usual monitoring layout: a row per metric, a column per GPU,
 * and a combined column when the model runs on more than one GPU.
 */
BenchPanel.define('features/dataManager/GpuUsageGrid', [
  'components/dom', 'components/DataTable/DataTable', 'constants/hardwareFields', 'utils/hardwareSummary', 'utils/numberFormat',
  'features/dataManager/profileInput',
], (dom, dataTable, hardwareFields, hardwareSummary, numberFormat, profileInput) => {
  'use strict';

  const COMBINE_NOTE = { average: 'average', sum: 'total', hottest: 'hottest' };

  /**
   * @param {{ model: Object, onEdit: Function, onAddGpu: (model: Object) => void, onRemoveGpu: (model: Object, index: number) => void }} props
   */
  function GpuUsageGrid(props) {
    const { model } = props;
    const gpus = model.profile.gpus;
    const summary = hardwareSummary.summarizeGpus(model.profile);

    const gpuColumns = gpus.map((gpu, index) => ({
      label: dom.h('span', { className: 'gpu-grid__head' }, `GPU ${index + 1}`,
        gpus.length > 1 ? dom.h('button', { type: 'button', className: 'gpu-grid__remove', text: '×', title: `Remove GPU ${index + 1}`,
          'aria-label': `Remove GPU ${index + 1}`, on: { click: () => props.onRemoveGpu(model, index) } }) : null),
      render: (row) => profileInput.NumberInput(model, `gpus.${index}.${row.field}`,
        { value: gpu[row.field], max: row.max, unit: row.unit, ariaLabel: `${row.label}, GPU ${index + 1}` }, props.onEdit),
    }));

    const columns = [
      { label: 'Metric', render: (row) => dom.h('span', { title: row.help || null, className: row.help ? 'has-help' : null, text: row.label }) },
      ...gpuColumns,
      gpus.length > 1 ? {
        label: 'All GPUs', align: 'right',
        render: (row) => dom.h('span', null,
          numberFormat.formatWithUnit(summary[row.field], row.decimals, row.unit),
          dom.h('span', { className: 'cell-sub', text: COMBINE_NOTE[row.combine] })),
      } : null,
    ].filter(Boolean);

    return dom.h('div', { className: 'gpu-grid' },
      dataTable.DataTable({ columns, rows: hardwareFields.GPU_USAGE_ROWS, caption: `GPU usage for ${model.name}` }),
      dom.h('button', { type: 'button', className: 'button button--quiet gpu-grid__add', text: '+ Add GPU',
        on: { click: () => props.onAddGpu(model) } }));
  }

  return { GpuUsageGrid };
});
