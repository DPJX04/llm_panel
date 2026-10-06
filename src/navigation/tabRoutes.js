/* The tabs, in order. Each tab mounts one feature through its public door. */
BenchPanel.define('navigation/tabRoutes', [
  'features/overview', 'features/comparison', 'features/modelDetail', 'features/accuracy', 'features/dataManager',
], (overview, comparison, modelDetail, accuracy, dataManager) => {
  'use strict';

  const TABS = Object.freeze([
    { id: 'overview', label: 'Overview', feature: overview },
    { id: 'compare', label: 'Compare models', feature: comparison },
    { id: 'detail', label: 'Model detail', feature: modelDetail },
    { id: 'accuracy', label: 'Accuracy', feature: accuracy },
    { id: 'data', label: 'Data', feature: dataManager },
  ]);

  return { TABS };
});
