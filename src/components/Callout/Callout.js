/* A status message with an icon and a label, so meaning never rests on colour alone. */
BenchPanel.define('components/Callout/Callout', ['components/dom'], (dom) => {
  'use strict';

  const ICONS = { success: '✓', warning: '!', error: '✕', info: 'i' };

  /**
   * @param {{ tone: 'success'|'warning'|'error'|'info', title: string, lines?: string[], note?: string }} props
   */
  function Callout(props) {
    const lines = props.lines || [];
    return dom.h('div', { className: `callout callout--${props.tone}`, role: props.tone === 'error' ? 'alert' : 'status' },
      dom.h('span', { className: 'callout__icon', 'aria-hidden': 'true', text: ICONS[props.tone] }),
      dom.h('div', { className: 'callout__body' },
        dom.h('div', { className: 'callout__title', text: props.title }),
        lines.length > 0 ? dom.h('ul', { className: 'callout__lines' }, lines.map((line) => dom.h('li', { text: line }))) : null,
        props.note ? dom.h('p', { className: 'callout__note', text: props.note }) : null));
  }

  return { Callout };
});
