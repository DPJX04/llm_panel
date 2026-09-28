/* Reads files the user picked or dropped and hands their text to the parser. */
BenchPanel.define('services/resultFileService', [
  'types/result', 'config/appConfig', 'utils/errorMessage', 'services/resultParser',
], (result, appConfig, errorMessage, resultParser) => {
  'use strict';

  function hasResultExtension(fileName) {
    const lower = fileName.toLowerCase();
    return appConfig.resultFileExtensions.some((extension) => lower.endsWith(extension));
  }

  /**
   * Reads every file. A bad file becomes a warning; the good ones still load.
   * @param {File[]} files
   * @param {{ fromFolder?: boolean }} [options]  folder picks skip files without a result extension
   * @returns {Promise<import('../types/result').Result<{ runs: Object[], workspaces: Object[], warnings: string[] }>>}
   */
  async function readResultFiles(files, options) {
    const fromFolder = Boolean(options && options.fromFolder);
    const candidates = fromFolder ? files.filter((file) => hasResultExtension(file.name)) : files;
    if (candidates.length === 0) return result.fail('No result files found (expected .json, .jsonl, .md or .txt).');

    const runs = [];
    const workspaces = [];
    const warnings = [];
    for (const file of candidates) {
      try {
        const parsed = resultParser.parseResultText(await file.text(), file.name);
        if (!parsed.ok) { warnings.push(parsed.error); continue; }
        runs.push(...parsed.data.runs);
        if (parsed.data.workspace) workspaces.push(parsed.data.workspace);
        warnings.push(...parsed.data.warnings);
      } catch (cause) {
        warnings.push(`${file.name}: ${errorMessage.toErrorMessage(cause)}`);
      }
    }
    if (runs.length === 0 && workspaces.length === 0) return result.fail(warnings.join('\n') || 'Nothing could be loaded.');
    return result.ok({ runs, workspaces, warnings });
  }

  return { readResultFiles };
});
