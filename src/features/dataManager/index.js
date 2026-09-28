/* Public door of the Data feature. */
BenchPanel.define('features/dataManager', ['features/dataManager/DataManagerView'], (view) => ({
  mount: view.mountDataManager,
}));
