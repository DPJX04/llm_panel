/* One row per model: its short name, how many runs it has, and a way to remove it. */
BenchPanel.define('features/dataManager/ModelProfilesTable', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag', 'features/dataManager/profileInput',
], (dom, dataTable, modelTag, profileInput) => {
  'use strict';

  /**
   * @param {{ models: Object[], runCounts: Object<string, number>,
   *           onEdit: (model: Object, path: string, text: string) => void, onRemove: (model: Object) => void }} props
   */
  function ModelProfilesTable(props) {
    const columns = [
      { label: 'Model', render: (model) => dom.h('div', null, modelTag.ModelTag(model), dom.h('span', { className: 'cell-sub', text: model.modelId })) },
      { label: 'Short name', render: (model) => profileInput.ProfileInput(model, 'shortName',
        { type: 'text', value: model.profile.shortName, placeholder: model.name, maxlength: '40', ariaLabel: 'Short name' }, props.onEdit) },
      { label: 'Runs', align: 'right', render: (model) => String(props.runCounts[model.key] || 0) },
      { label: '', render: (model) => dom.h('button', { type: 'button', className: 'button button--quiet', text: 'Remove',
        'aria-label': `Remove ${model.modelId} and its runs`, on: { click: () => props.onRemove(model) } }) },
    ];
    return dataTable.DataTable({ columns, rows: props.models, caption: 'Models' });
  }

  return { ModelProfilesTable };
});
