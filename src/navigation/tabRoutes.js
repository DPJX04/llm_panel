/* The tabs, in order. Each tab mounts one feature through its public door. */
BenchPanel.define('navigation/tabRoutes', [
  'features/overview', 'features/comparison', 'features/modelDetail', 'features/accuracy', 'features/dataManager',
  'features/vectorDb',
], (overview, comparison, modelDetail, accuracy, dataManager, vectorDb) => {
  'use strict';

  const TABS = Object.freeze([
    { id: 'overview', label: 'Overview', feature: overview },
    { id: 'compare', label: 'Compare models', feature: comparison },
    { id: 'detail', label: 'Model detail', feature: modelDetail },
    { id: 'accuracy', label: 'Accuracy', feature: accuracy },
    { id: 'data', label: 'Data', feature: dataManager },
    // Vector database results: their own tab and load button, apart from the LLM tabs above.
    { id: 'vectordb', label: 'Vector DB', feature: vectorDb },
  ]);

  return { TABS };
});
