/* The result of the last import: what loaded, and any file that was skipped and why. */
BenchPanel.define('features/dataManager/ImportNotice', ['components/dom'], (dom) => {
  'use strict';

  const ICONS = { success: '✓', warning: '!', error: '✕' };

  /** @param {{ tone: 'success'|'warning'|'error', title: string, lines: string[] }} notice */
  function ImportNotice(notice) {
    return dom.h('div', { className: `import-notice import-notice--${notice.tone}`, role: 'status' },
      dom.h('span', { className: 'import-notice__icon', 'aria-hidden': 'true', text: ICONS[notice.tone] }),
      dom.h('div', null,
        dom.h('div', { className: 'import-notice__title', text: notice.title }),
        notice.lines.length > 0
          ? dom.h('ul', { className: 'import-notice__lines' }, notice.lines.map((line) => dom.h('li', { text: line })))
          : null));
  }

  return { ImportNotice };
});
