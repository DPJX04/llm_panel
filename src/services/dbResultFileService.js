/* Reads the files dropped or picked on the Vector DB tab: VectorDBBench JSON results, or a CSV with one run per row. */
BenchPanel.define('services/dbResultFileService', [
  'types/result', 'utils/errorMessage', 'services/dbResultParser', 'services/dbResultCsvParser',
], (result, errorMessage, dbResultParser, dbResultCsvParser) => {
  'use strict';

  function isCsv(fileName) {
    return fileName.toLowerCase().endsWith('.csv');
  }

  /**
   * Reads every file. A bad file becomes a warning; the good ones still load.
   * @param {File[]} files
   * @returns {Promise<import('../types/result').Result<{ results: Object[], warnings: string[] }>>}
   *   fails only when no file held a usable run
   */
  async function readDbResultFiles(files) {
    const results = [];
    const warnings = [];
    for (const file of files) {
      try {
        const text = await file.text();
        if (text.trim() === '') { warnings.push(`${file.name}: the file is empty (is it saved?)`); continue; }
        const parsed = isCsv(file.name) ? dbResultCsvParser.parseDbResultCsv(text, file.name) : dbResultParser.parseDbResultText(text, file.name);
        if (parsed === null) warnings.push(`${file.name}: not a VectorDBBench result file (or a CSV of results)`);
        else if (!parsed.ok) warnings.push(parsed.error);
        else { results.push(...parsed.data.results); warnings.push(...parsed.data.warnings); }
      } catch (cause) {
        warnings.push(`${file.name}: ${errorMessage.toErrorMessage(cause)}`);
      }
    }
    return results.length > 0 ? result.ok({ results, warnings }) : result.fail(warnings.join('\n') || 'Nothing could be loaded.');
  }

  return { readDbResultFiles };
});
