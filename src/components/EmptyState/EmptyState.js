/* What a view shows before any results are loaded. */
BenchPanel.define('components/EmptyState/EmptyState', ['components/dom'], (dom) => {
  'use strict';

  /** @param {{ title: string, message: string, actionLabel?: string, onAction?: () => void }} options */
  function EmptyState(options) {
    return dom.h('div', { className: 'empty-state' },
      dom.h('div', { className: 'empty-state__title', text: options.title }),
      dom.h('p', { className: 'empty-state__message', text: options.message }),
      options.onAction
        ? dom.h('button', { type: 'button', className: 'button button--primary', text: options.actionLabel, on: { click: options.onAction } })
        : null);
  }

  return { EmptyState };
});
