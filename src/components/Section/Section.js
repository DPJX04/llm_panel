/* A titled card that holds one block of the report, with optional controls on the right. */
BenchPanel.define('components/Section/Section', ['components/dom'], (dom) => {
  'use strict';

  /**
   * @param {{ title: string, description?: string, actions?: Node[], footnote?: string }} options
   * @param {...Node} children
   */
  function Section(options, ...children) {
    return dom.h('section', { className: 'section-card' },
      dom.h('header', { className: 'section-card__header' },
        dom.h('div', { className: 'section-card__titles' },
          dom.h('h2', { className: 'section-card__title', text: options.title }),
          options.description ? dom.h('p', { className: 'section-card__description', text: options.description }) : null),
        options.actions ? dom.h('div', { className: 'section-card__actions' }, options.actions) : null),
      dom.h('div', { className: 'section-card__body' }, children),
      options.footnote ? dom.h('p', { className: 'section-card__footnote', text: options.footnote }) : null);
  }

  /** A smaller heading inside a section, e.g. one per concurrency level. */
  function SubSection(options, ...children) {
    return dom.h('div', { className: 'sub-section' },
      dom.h('h3', { className: 'sub-section__title' }, options.title),
      options.description ? dom.h('p', { className: 'sub-section__description', text: options.description }) : null,
      children);
  }

  return { Section, SubSection };
});
