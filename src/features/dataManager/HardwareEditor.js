/*
 * Hardware and memory for one model: fill from a vLLM log or a pasted GPU usage table, or type.
 * Feeds the GPU usage, Memory and KV cache sections of the Compare tab.
 */
BenchPanel.define('features/dataManager/HardwareEditor', [
  'components/dom', 'components/Section/Section', 'components/SelectField/SelectField', 'components/Callout/Callout',
  'constants/hardwareFields', 'features/dataManager/profileInput', 'features/dataManager/GpuUsageGrid',
], (dom, section, selectField, callout, hardwareFields, profileInput, gpuUsageGrid) => {
  'use strict';

  const PASTE_EXAMPLE = [
    '| Metric                     | GPU 1    |',
    '| Average GPU utilization    | 95.7%    |',
    '| Average memory used        | 21.30 GB |',
    '| Average memory utilization | 93.6%    |',
    '| Average power              | 223.9 W  |',
    '| Average temperature        | 67.3°C   |',
  ].join('\n');

  function Toolbar(props) {
    const logInput = dom.h('input', { type: 'file', hidden: true, accept: '.log,.txt',
      on: { change: (event) => { if (event.target.files[0]) props.onLogFile(props.model, event.target.files[0]); event.target.value = ''; } } });
    return dom.h('div', { className: 'hardware-editor__toolbar' },
      dom.h('button', { type: 'button', className: 'button', text: 'Fill from vLLM log…',
        title: 'Pick the `vllm serve` log of this model to fill weights, KV cache and GPU count', on: { click: () => logInput.click() } }),
      dom.h('button', { type: 'button', className: `button${props.paste.open ? ' button--active' : ''}`, text: 'Paste GPU usage table',
        on: { click: props.paste.onToggle } }),
      logInput);
  }

  function PastePanel(props) {
    const area = dom.h('textarea', { className: 'hardware-editor__paste', rows: '7', placeholder: PASTE_EXAMPLE, value: props.paste.text,
      'aria-label': 'GPU usage table to paste', on: { input: (event) => props.paste.onText(event.target.value) } });
    return dom.h('div', { className: 'hardware-editor__paste-panel' },
      dom.h('p', { className: 'hint', text: 'Paste your GPU usage table: one metric per row, one column per GPU. Markdown, tab-separated (copied from a rendered table) or space-aligned all work.' }),
      area,
      dom.h('div', { className: 'hardware-editor__toolbar' },
        dom.h('button', { type: 'button', className: 'button button--primary', text: 'Apply', on: { click: () => props.paste.onApply(area.value) } }),
        dom.h('button', { type: 'button', className: 'button button--quiet', text: 'Cancel', on: { click: props.paste.onToggle } })));
  }

  function MemoryFields(props) {
    const { model } = props;
    return dom.h('div', { className: 'hardware-editor__group' },
      dom.h('h3', { className: 'sub-section__title', text: 'Memory' }),
      dom.h('div', { className: 'hardware-editor__fields' },
        profileInput.LabeledField('Model weights',
          profileInput.NumberInput(model, 'modelSizeGb', { value: model.profile.modelSizeGb, unit: 'GB', ariaLabel: 'Model weights' }, props.onEdit),
          '"Model loading took N GiB" in the vLLM startup log, summed across GPUs.'),
        profileInput.LabeledField('GPU memory per card',
          profileInput.NumberInput(model, 'gpuMemoryTotalGb', { value: model.profile.gpuMemoryTotalGb, unit: 'GB', ariaLabel: 'GPU memory per card' }, props.onEdit),
          'Capacity of one GPU, e.g. 24 for an L4 or RTX 4090. Used to show how much of the GPU the model occupies.')));
  }

  function KvCacheFields(props) {
    const { model } = props;
    return dom.h('div', { className: 'hardware-editor__group' },
      dom.h('h3', { className: 'sub-section__title', text: 'KV cache' }),
      dom.h('div', { className: 'hardware-editor__fields' }, hardwareFields.KV_CACHE_ROWS.map((row) =>
        profileInput.LabeledField(row.label,
          profileInput.NumberInput(model, `kvCache.${row.field}`, { value: model.profile.kvCache[row.field], unit: row.unit, ariaLabel: row.label }, props.onEdit),
          row.help))));
  }

  /**
   * @param {{ models: Object[], model: Object, onSelect: (key: string) => void, onEdit: Function,
   *   onAddGpu: Function, onRemoveGpu: Function, onLogFile: (model: Object, file: File) => void,
   *   paste: { open: boolean, text: string, onToggle: () => void, onText: (text: string) => void, onApply: (text: string) => void },
   *   notice: Object|null }} props
   */
  function HardwareEditor(props) {
    const picker = selectField.SelectField({
      label: 'Model', value: props.model.key,
      options: props.models.map((model) => ({ value: model.key, label: model.name })),
      onChange: props.onSelect,
    });
    return section.Section({
      title: 'Hardware and memory',
      description: 'Result files do not record hardware. For each model, fill these from its vLLM server log and your GPU monitoring, or type them. They feed the GPU usage, Memory and KV cache sections in Compare.',
      actions: [picker],
    },
    Toolbar(props),
    props.paste.open ? PastePanel(props) : null,
    props.notice ? dom.h('div', { className: 'data-notice' }, callout.Callout(props.notice)) : null,
    dom.h('div', { className: 'hardware-editor__groups' }, MemoryFields(props), KvCacheFields(props)),
    dom.h('div', { className: 'hardware-editor__group' },
      dom.h('h3', { className: 'sub-section__title', text: 'GPU usage during the benchmark' }),
      gpuUsageGrid.GpuUsageGrid({ model: props.model, onEdit: props.onEdit, onAddGpu: props.onAddGpu, onRemoveGpu: props.onRemoveGpu })));
  }

  return { HardwareEditor };
});
