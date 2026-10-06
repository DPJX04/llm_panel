/*
 * Reads files the user picked or dropped. Evaluation reports go to their own parser; benchmark results and
 * workspace files go to the result parser; anything that is not JSON is tried as a `vllm serve` log.
 */
BenchPanel.define('services/resultFileService', [
  'types/result', 'config/appConfig', 'utils/errorMessage', 'services/resultParser', 'services/vllmLogParser',
  'services/evalReportParser',
], (result, appConfig, errorMessage, resultParser, vllmLogParser, evalReportParser) => {
  'use strict';

  function hasResultExtension(fileName) {
    const lower = fileName.toLowerCase();
    return appConfig.resultFileExtensions.some((extension) => lower.endsWith(extension));
  }

  /** Reads one file's text as a vLLM server log. */
  async function readLogFile(file) {
    try {
      const parsed = vllmLogParser.parseVllmLog(await file.text());
      return parsed.ok ? parsed : result.fail(`${file.name}: ${parsed.error}`);
    } catch (cause) {
      return result.fail(`${file.name}: ${errorMessage.toErrorMessage(cause)}`);
    }
  }

  /**
   * Reads every file. A bad file becomes a warning; the good ones still load.
   * @param {File[]} files
   * @param {{ fromFolder?: boolean }} [options]  folder picks skip files without a known extension
   * @returns {Promise<import('../types/result').Result<{ runs: Object[], workspaces: Object[], evalReports: Object[],
   *   logs: Array<{ fileName: string, stats: Object }>, warnings: string[] }>>}
   */
  async function readResultFiles(files, options) {
    const fromFolder = Boolean(options && options.fromFolder);
    const candidates = fromFolder ? files.filter((file) => hasResultExtension(file.name)) : files;
    if (candidates.length === 0) return result.fail('No result files found (expected .json, .jsonl, .md, .txt or .log).');

    const runs = [];
    const workspaces = [];
    const evalReports = [];
    const logs = [];
    const warnings = [];
    for (const file of candidates) {
      try {
        const text = await file.text();
        const report = evalReportParser.parseEvalReportText(text, file.name);
        if (report) {
          if (report.ok) evalReports.push(report.data);
          else warnings.push(report.error);
          continue;
        }
        const parsed = resultParser.parseResultText(text, file.name);
        if (parsed.ok) {
          runs.push(...parsed.data.runs);
          if (parsed.data.workspace) workspaces.push(parsed.data.workspace);
          warnings.push(...parsed.data.warnings);
          continue;
        }
        const log = vllmLogParser.parseVllmLog(text);
        if (log.ok) logs.push({ fileName: file.name, stats: log.data });
        else warnings.push(file.name.toLowerCase().endsWith('.log') ? `${file.name}: ${log.error}` : parsed.error);
      } catch (cause) {
        warnings.push(`${file.name}: ${errorMessage.toErrorMessage(cause)}`);
      }
    }
    if (runs.length === 0 && workspaces.length === 0 && evalReports.length === 0 && logs.length === 0) {
      return result.fail(warnings.join('\n') || 'Nothing could be loaded.');
    }
    return result.ok({ runs, workspaces, evalReports, logs, warnings });
  }

  return { readResultFiles, readLogFile };
});
