/* A headline number: what it is, its value, who holds it, and how far ahead they are. */
BenchPanel.define('components/StatTile/StatTile', ['components/dom', 'components/ModelTag/ModelTag'], (dom, modelTag) => {
  'use strict';

  /**
   * @param {{ label: string, value: string, model?: Object, detail?: string, detailTone?: 'good'|'neutral', context?: string }} options
   */
  function StatTile(options) {
    return dom.h('div', { className: 'stat-tile' },
      dom.h('div', { className: 'stat-tile__label', text: options.label }),
      dom.h('div', { className: 'stat-tile__value', text: options.value }),
      options.model ? dom.h('div', { className: 'stat-tile__model' }, modelTag.ModelTag(options.model)) : null,
      options.detail ? dom.h('div', { className: `stat-tile__detail${options.detailTone === 'neutral' ? ' stat-tile__detail--neutral' : ''}`, text: options.detail }) : null,
      options.context ? dom.h('div', { className: 'stat-tile__context', text: options.context }) : null);
  }

  return { StatTile };
});
