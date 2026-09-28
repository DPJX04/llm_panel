/*
 * The dependency law for this codebase: which layers each layer may use.
 * A layer may always use its own layer, except that a feature may only use its own files.
 * Enforced when each module loads, by moduleRegistry.js.
 */
window.BenchPanelLayerRules = Object.freeze({
  main: ['navigation', 'features', 'store', 'services', 'components', 'utils', 'constants', 'config', 'types'],
  navigation: ['features', 'components', 'utils', 'constants', 'types'],
  features: ['store', 'services', 'components', 'utils', 'constants', 'types'],
  components: ['store', 'utils', 'constants', 'types'],
  store: ['services', 'utils', 'types'],
  services: ['utils', 'types', 'config'],
  utils: ['types', 'constants'],
  constants: [],
  config: [],
  types: [],
});
