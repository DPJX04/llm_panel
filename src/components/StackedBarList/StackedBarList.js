/*
 * One horizontal bar per model, split into parts (e.g. weights, KV cache, other, free),
 * all on one scale so bar lengths compare. A legend names the parts; each part shows its value on hover.
 */
BenchPanel.define('components/StackedBarList/StackedBarList', ['components/dom', 'components/ModelTag/ModelTag'], (dom, modelTag) => {
  'use strict';

  /**
   * @param {{
   *   parts: Array<{ key: string, label: string, color: string }>,
   *   items: Array<{ model: Object, values: Object<string, number|null>, valueText: string }>,
   *   formatValue: (value: number) => string,
   *   ariaLabel: string,
   * }} props
   */
  function StackedBarList(props) {
    const totals = props.items.map((item) => props.parts.reduce((sum, part) => sum + (item.values[part.key] || 0), 0));
    const max = Math.max(0, ...totals);

    const legend = dom.h('div', { className: 'chart-legend' }, props.parts.map((part) =>
      dom.h('span', { className: 'chart-legend__item' },
        dom.h('span', { className: 'stacked-bars__swatch', style: { background: part.color } }), part.label)));

    const rows = props.items.map((item, index) => dom.h('div', { className: 'stacked-bars__row', role: 'listitem' },
      dom.h('div', { className: 'stacked-bars__label' }, modelTag.ModelTag(item.model)),
      dom.h('div', { className: 'stacked-bars__track' },
        dom.h('div', { className: 'stacked-bars__bar', style: { width: `calc((100% - var(--bar-label-room)) * ${max > 0 ? totals[index] / max : 0})` } },
          props.parts.map((part) => {
            const value = item.values[part.key];
            if (!value) return null;
            return dom.h('span', {
              className: 'stacked-bars__part',
              style: { flex: `${value} 0 0`, background: part.color },
              title: `${part.label}: ${props.formatValue(value)}`,
            });
          })),
        dom.h('span', { className: 'stacked-bars__value', text: item.valueText }))));

    return dom.h('div', { className: 'stacked-bars' }, legend,
      dom.h('div', { className: 'stacked-bars__rows', role: 'list', 'aria-label': props.ariaLabel }, rows));
  }

  return { StackedBarList };
});
