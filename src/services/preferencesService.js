/* Remembers small view choices in this browser, such as which Compare sections are shown. */
BenchPanel.define('services/preferencesService', ['config/appConfig'], (appConfig) => {
  'use strict';

  function readAll() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(appConfig.preferencesKey) || '{}');
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch (cause) {
      return {};
    }
  }

  /** @returns {unknown} the saved value, or `fallback` when none was saved or storage is blocked */
  function load(name, fallback) {
    const all = readAll();
    return name in all ? all[name] : fallback;
  }

  function save(name, value) {
    try {
      window.localStorage.setItem(appConfig.preferencesKey, JSON.stringify({ ...readAll(), [name]: value }));
    } catch (cause) {
      // Storage may be blocked (private window); the choice then lasts until the page closes.
    }
  }

  return { load, save };
});
