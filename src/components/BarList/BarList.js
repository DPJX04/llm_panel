/* Horizontal bars, one per model, already sorted by the caller. The value sits at each bar's tip. */
BenchPanel.define('components/BarList/BarList', ['components/dom', 'components/ModelTag/ModelTag'], (dom, modelTag) => {
  'use strict';

  /**
   * @param {{ items: Array<{ model: Object, value: number|null, valueText: string }>, ariaLabel: string }} options
   */
  function BarList(options) {
    const max = Math.max(0, ...options.items.map((item) => item.value || 0));
    return dom.h('div', { className: 'bar-list', role: 'list', 'aria-label': options.ariaLabel },
      options.items.map((item) => {
        const share = max > 0 && item.value ? item.value / max : 0;
        return dom.h('div', { className: 'bar-list__row', role: 'listitem' },
          dom.h('div', { className: 'bar-list__label' }, modelTag.ModelTag(item.model)),
          dom.h('div', { className: 'bar-list__track' },
            dom.h('div', { className: 'bar-list__bar', style: { width: `calc((100% - var(--bar-label-room)) * ${share})`, '--bar-color': dom.seriesColor(item.model.colorSlot) } }),
            dom.h('span', { className: 'bar-list__value', text: item.valueText })));
      }));
  }

  return { BarList };
});
