/* Entry point: restore the saved workspace, then draw the app. Opens on Data when nothing is loaded yet. */
BenchPanel.define('main', ['store/workspaceStore', 'navigation/appShell'], (workspaceStore, appShell) => {
  'use strict';

  workspaceStore.init();
  appShell.mountAppShell(document.getElementById('app'), {
    initialTab: workspaceStore.getState().runs.length > 0 ? 'overview' : 'data',
  });
});
