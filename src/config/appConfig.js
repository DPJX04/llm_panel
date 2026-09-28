/* The one config source. Every fixed app setting lives here; nothing else hardcodes these values. */
BenchPanel.define('config/appConfig', [], () => {
  'use strict';

  return {
    storageKey: 'benchmark-panel.workspace.v1',
    workspaceFileKind: 'benchmark-panel-workspace',
    workspaceFileVersion: 1,
    resultFileExtensions: ['.json', '.jsonl', '.md', '.txt'],
    maxShortNameLength: 40,
  };
});
