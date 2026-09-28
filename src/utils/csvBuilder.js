/* Builds CSV text that opens cleanly in Excel. */
BenchPanel.define('utils/csvBuilder', [], () => {
  'use strict';

  function escapeCell(value) {
    if (value === null || value === undefined) return '';
    let text = String(value);
    // A text cell starting with = + - @ would run as a formula in Excel; numbers are safe.
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  /** @param {string[]} headers  @param {Array<Array<string|number|null>>} rows */
  function toCsv(headers, rows) {
    return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
  }

  return { toCsv };
});
