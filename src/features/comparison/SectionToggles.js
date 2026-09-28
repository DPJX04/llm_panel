/* Check boxes that show or hide each part of the Compare tab. */
BenchPanel.define('features/comparison/SectionToggles', ['components/dom'], (dom) => {
  'use strict';

  /**
   * @param {{ sections: Array<{ id: string, label: string }>, hidden: Set<string>, onToggle: (id: string) => void }} props
   */
  function SectionToggles(props) {
    return dom.h('fieldset', { className: 'section-toggles' },
      dom.h('legend', { className: 'section-toggles__legend', text: 'Show' }),
      props.sections.map((item) => dom.h('label', { className: 'section-toggles__item' },
        dom.h('input', { type: 'checkbox', checked: !props.hidden.has(item.id), on: { change: () => props.onToggle(item.id) } }),
        item.label)));
  }

  return { SectionToggles };
});
