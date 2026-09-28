/*
 * One editable row per model: its short name and the hardware numbers the result files do not contain.
 * Edits apply when the field loses focus or Enter is pressed.
 */
BenchPanel.define('features/dataManager/ModelProfilesTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag',
], (dom, dataTable, modelTag) => {
  'use strict';

  const NUMBER_FIELDS = [
    { field: 'modelSizeGb', label: 'Model size (GB)', step: '0.1', max: null },
    { field: 'vramGb', label: 'VRAM used (GB)', step: '0.01', max: null },
    { field: 'gpuUtilPct', label: 'GPU util (%)', step: '0.1', max: '100' },
    { field: 'powerW', label: 'Power (W)', step: '0.1', max: null },
  ];

  function input(model, field, props, onEdit) {
    const { ariaLabel, ...attributes } = props;
    return dom.h('input', {
      className: `profile-input${props.type === 'number' ? ' profile-input--number' : ''}`,
      'data-focus-key': `${model.key}::${field}`,
      'aria-label': `${ariaLabel} for ${model.modelId}`,
      ...attributes,
      on: {
        change: (event) => onEdit(model, field, event.target.value),
        keydown: (event) => { if (event.key === 'Enter') event.target.blur(); },
      },
    });
  }

  /**
   * @param {{ models: Object[], runCounts: Object<string, number>,
   *           onEdit: (model: Object, field: string, text: string) => void, onRemove: (model: Object) => void }} props
   */
  function ModelProfilesTable(props) {
    const columns = [
      { label: 'Model', render: (model) => dom.h('div', null, modelTag.ModelTag(model), dom.h('span', { className: 'cell-sub', text: model.modelId })) },
      { label: 'Short name', render: (model) => input(model, 'shortName',
        { type: 'text', value: model.profile.shortName, placeholder: model.name, maxlength: '40', ariaLabel: 'Short name' }, props.onEdit) },
      ...NUMBER_FIELDS.map((spec) => ({
        label: spec.label,
        render: (model) => input(model, spec.field, {
          type: 'number', min: '0', max: spec.max, step: spec.step, inputmode: 'decimal', ariaLabel: spec.label,
          value: model.profile[spec.field] === null ? '' : String(model.profile[spec.field]),
        }, props.onEdit),
      })),
      { label: 'Runs', align: 'right', render: (model) => String(props.runCounts[model.key] || 0) },
      { label: '', render: (model) => dom.h('button', { type: 'button', className: 'button button--quiet', text: 'Remove',
        'aria-label': `Remove ${model.modelId} and its runs`, on: { click: () => props.onRemove(model) } }) },
    ];
    return dataTable.DataTable({ columns, rows: props.models, caption: 'Model profiles' });
  }

  return { ModelProfilesTable };
});
