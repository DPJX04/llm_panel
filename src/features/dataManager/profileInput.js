/*
 * Inputs bound to one field of a model's profile. Edits apply when the field loses focus or Enter is pressed.
 * Each input carries a focus key, so the view can put focus back after it re-renders.
 */
BenchPanel.define('features/dataManager/profileInput', ['components/dom'], (dom) => {
  'use strict';

  /**
   * @param {Object} model
   * @param {string} path  profile field, e.g. 'gpus.0.powerW'
   * @param {Object} props  input attributes, plus ariaLabel
   * @param {(model: Object, path: string, text: string) => void} onEdit
   */
  function ProfileInput(model, path, props, onEdit) {
    const { ariaLabel, ...attributes } = props;
    return dom.h('input', {
      className: `profile-input${props.type === 'number' ? ' profile-input--number' : ''}`,
      'data-focus-key': `${model.key}::${path}`,
      'aria-label': `${ariaLabel} for ${model.modelId}`,
      ...attributes,
      on: {
        change: (event) => onEdit(model, path, event.target.value),
        keydown: (event) => { if (event.key === 'Enter') event.target.blur(); },
      },
    });
  }

  /** A numeric profile input with its unit after it. */
  function NumberInput(model, path, spec, onEdit) {
    return dom.h('span', { className: 'number-input' },
      ProfileInput(model, path, {
        type: 'number', min: '0', max: spec.max ? String(spec.max) : null, step: 'any', inputmode: 'decimal',
        value: spec.value === null ? '' : String(spec.value), ariaLabel: spec.ariaLabel,
      }, onEdit),
      spec.unit ? dom.h('span', { className: 'number-input__unit', text: spec.unit }) : null);
  }

  /** A label above a control, with the field's explanation on hover. */
  function LabeledField(label, control, help) {
    return dom.h('label', { className: 'labeled-field', title: help },
      dom.h('span', { className: 'labeled-field__label', text: label }), control);
  }

  return { ProfileInput, NumberInput, LabeledField };
});
