/* The one config source. Every fixed app setting lives here; nothing else hardcodes these values. */
BenchPanel.define('config/appConfig', [], () => {
  'use strict';

  return {
    storageKey: 'benchmark-panel.workspace.v1',
    preferencesKey: 'benchmark-panel.preferences.v1',
    workspaceFileKind: 'benchmark-panel-workspace',
    workspaceFileVersion: 3,
    resultFileExtensions: ['.json', '.jsonl', '.md', '.txt', '.log'],
    maxShortNameLength: 40,

    evalRequestTimeoutMs: 300000,
    evalModelListTimeoutMs: 15000,
    // Long replies are cut when saved, so the workspace stays within browser storage limits.
    maxSavedAnswerLength: 4000,
  };
});
