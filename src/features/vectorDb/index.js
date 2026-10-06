/* Public door of the Vector DB feature. */
BenchPanel.define('features/vectorDb', ['features/vectorDb/VectorDbView'], (view) => ({
  mount: view.mountVectorDb,
}));
