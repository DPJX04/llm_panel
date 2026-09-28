/*
 * Tiny module registry. Stands in for ES modules, which browsers block on file:// pages,
 * and for a lint rule: every define() is checked against the layer rules and fails loudly.
 */
(function () {
  'use strict';

  function layerOf(id) {
    return id.split('/')[0];
  }

  function featureOf(id) {
    return id.split('/')[1];
  }

  function isFeatureDoor(id) {
    return id.split('/').length === 2;
  }

  /** Returns a violation message, or null when `fromId` may depend on `depId`. */
  function checkDependency(fromId, depId, rules) {
    const from = layerOf(fromId);
    const to = layerOf(depId);
    if (!(from in rules)) return `"${fromId}" is in unknown layer "${from}"`;
    if (!(to in rules)) return `"${depId}" is in unknown layer "${to}"`;

    if (to === 'features') {
      if (from === 'features') {
        return featureOf(fromId) === featureOf(depId)
          ? null
          : `feature "${fromId}" uses sibling feature "${depId}" (features never touch each other)`;
      }
      if (!isFeatureDoor(depId)) {
        return `"${fromId}" reaches past the public door of "${depId}" (use "features/${featureOf(depId)}")`;
      }
    }
    if (from === to) return null;
    return rules[from].includes(to) ? null : `"${fromId}" (${from}) may not use "${depId}" (${to})`;
  }

  function createModuleRegistry(rules) {
    const modules = new Map();

    function define(id, deps, factory) {
      if (modules.has(id)) throw new Error(`Module "${id}" is defined twice`);
      const resolved = deps.map((depId) => {
        const violation = checkDependency(id, depId, rules);
        if (violation) throw new Error(`Dependency rule broken: ${violation}`);
        if (!modules.has(depId)) {
          throw new Error(`"${id}" needs "${depId}", which has not loaded yet. Check src/loadOrder.js.`);
        }
        return modules.get(depId);
      });
      const api = Object.freeze(factory(...resolved) || {});
      modules.set(id, api);
      return api;
    }

    function require(id) {
      if (!modules.has(id)) throw new Error(`Module "${id}" is not loaded`);
      return modules.get(id);
    }

    return Object.freeze({ define, require });
  }

  window.BenchPanelPlatform = Object.freeze({ createModuleRegistry, checkDependency });
  window.BenchPanel = createModuleRegistry(window.BenchPanelLayerRules);
})();
