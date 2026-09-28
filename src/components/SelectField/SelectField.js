/* A labelled drop-down. */
BenchPanel.define('components/SelectField/SelectField', ['components/dom'], (dom) => {
  'use strict';

  /**
   * @param {{ label: string, value: string, options: Array<{ value: string, label: string }>, onChange: (value: string) => void }} props
   */
  function SelectField(props) {
    const select = dom.h('select', { className: 'select-field__control', on: { change: (event) => props.onChange(event.target.value) } },
      props.options.map((option) => dom.h('option', { value: option.value, selected: option.value === props.value, text: option.label })));
    return dom.h('label', { className: 'select-field' },
      dom.h('span', { className: 'select-field__label', text: props.label }), select);
  }

  return { SelectField };
});
