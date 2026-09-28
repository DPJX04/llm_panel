(function () {
  'use strict';

  const { createModuleRegistry } = window.BenchPanelPlatform;

  function freshRegistry() {
    return createModuleRegistry(window.BenchPanelLayerRules);
  }

  test('registry: a lower layer may not use a higher one', () => {
    const registry = freshRegistry();
    registry.define('features/demo', [], () => ({}));
    assert.throws(() => registry.define('utils/bad', ['features/demo'], () => ({})), /may not use/);
  });

  test('registry: a service may not use the store', () => {
    const registry = freshRegistry();
    registry.define('store/demoStore', [], () => ({}));
    assert.throws(() => registry.define('services/bad', ['store/demoStore'], () => ({})), /may not use/);
  });

  test('registry: a feature may not use a sibling feature', () => {
    const registry = freshRegistry();
    registry.define('features/alpha', [], () => ({}));
    assert.throws(() => registry.define('features/beta/View', ['features/alpha'], () => ({})), /sibling feature/);
  });

  test('registry: outside code must enter a feature through its door', () => {
    const registry = freshRegistry();
    registry.define('features/alpha/internal', [], () => ({}));
    assert.throws(() => registry.define('navigation/shell', ['features/alpha/internal'], () => ({})), /public door/);
  });

  test('registry: allowed dependencies resolve, in load order', () => {
    const registry = freshRegistry();
    registry.define('types/shape', [], () => ({ kind: 'shape' }));
    const api = registry.define('utils/uses', ['types/shape'], (shape) => ({ kind: shape.kind }));
    assert.equal(api.kind, 'shape');
    assert.throws(() => registry.define('utils/early', ['utils/notYet'], () => ({})), /has not loaded yet/);
  });

  test('registry: every app module loaded without breaking a rule', () => {
    assert.ok(window.BenchPanel.require('navigation/appShell').mountAppShell, 'app shell loaded');
  });
})();
