/*
 * The frame around every view: title bar, tabs, print button, and one panel per tab.
 * The open tab lives in the URL hash (#compare), so a refresh or a shared link reopens it.
 */
BenchPanel.define('navigation/appShell', ['components/dom', 'navigation/tabRoutes'], (dom, tabRoutes) => {
  'use strict';

  const { TABS } = tabRoutes;

  function tabFromHash() {
    const id = window.location.hash.replace('#', '');
    return TABS.some((tab) => tab.id === id) ? id : null;
  }

  /**
   * @param {HTMLElement} root
   * @param {{ initialTab: string }} options  used when the URL does not name a tab
   */
  function mountAppShell(root, options) {
    const buttons = new Map();
    const panels = new Map();

    function select(id) {
      TABS.forEach((tab) => {
        const active = tab.id === id;
        buttons.get(tab.id).setAttribute('aria-selected', String(active));
        buttons.get(tab.id).tabIndex = active ? 0 : -1;
        panels.get(tab.id).hidden = !active;
      });
      window.scrollTo(0, 0);
    }

    function navigate(id) {
      if (tabFromHash() === id) select(id);
      else window.location.hash = id;
    }

    function onTabKeydown(event) {
      const index = TABS.findIndex((tab) => tab.id === event.currentTarget.dataset.tab);
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (step === 0) return;
      const next = TABS[(index + step + TABS.length) % TABS.length];
      navigate(next.id);
      buttons.get(next.id).focus();
    }

    const tabList = dom.h('nav', { className: 'app-tabs', role: 'tablist', 'aria-label': 'Views' }, TABS.map((tab) => {
      const button = dom.h('button', {
        type: 'button', role: 'tab', id: `tab-${tab.id}`, 'aria-controls': `panel-${tab.id}`, 'data-tab': tab.id,
        className: 'app-tabs__tab', text: tab.label,
        on: { click: () => navigate(tab.id), keydown: onTabKeydown },
      });
      buttons.set(tab.id, button);
      return button;
    }));

    const header = dom.h('header', { className: 'app-header' },
      dom.h('div', { className: 'app-header__inner' },
        dom.h('div', { className: 'app-header__brand' },
          dom.h('span', { className: 'app-header__logo', 'aria-hidden': 'true' }),
          dom.h('span', { className: 'app-header__name', text: 'LLM Benchmark Panel' })),
        tabList,
        dom.h('button', { type: 'button', className: 'button button--quiet app-header__print', text: 'Print / PDF', on: { click: () => window.print() } })));

    const main = dom.h('main', { className: 'app-main' }, TABS.map((tab) => {
      const panel = dom.h('div', { className: 'app-panel', role: 'tabpanel', id: `panel-${tab.id}`, 'aria-labelledby': `tab-${tab.id}`, hidden: true });
      panels.set(tab.id, panel);
      return panel;
    }));

    dom.clear(root);
    root.append(header, main);
    TABS.forEach((tab) => tab.feature.mount(panels.get(tab.id), { navigate }));

    window.addEventListener('hashchange', () => select(tabFromHash() || options.initialTab));
    select(tabFromHash() || options.initialTab);
  }

  return { mountAppShell };
});
