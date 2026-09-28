/*
 * Loads the stylesheets and scripts listed in loadOrder.js, in that order.
 * Scripts are injected with async=false, which keeps execution order on file:// pages.
 */
(function () {
  'use strict';

  function addStyle(href) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function addScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.appendChild(script);
  }

  /**
   * @param {string} basePath  path from the host page to the project root, e.g. './' or '../'
   * @param {{ withTests?: boolean }} [options]
   */
  function loadApp(basePath, options) {
    const order = window.BenchPanelLoadOrder;
    const withTests = Boolean(options && options.withTests);
    order.styles.forEach((path) => addStyle(basePath + path));
    order.scripts.forEach((path) => addScript(basePath + path));
    if (withTests) order.tests.forEach((path) => addScript(basePath + path));
    else addScript(basePath + order.entry);
  }

  window.BenchPanelLoader = Object.freeze({ loadApp });
})();
