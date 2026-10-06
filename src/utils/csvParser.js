/*
 * Reads CSV text into rows of cells. A quoted cell may hold separators, line breaks and doubled quotes ("").
 * Also reads files separated by ";" (Excel in some regions) or tabs.
 */
BenchPanel.define('utils/csvParser', [], () => {
  'use strict';

  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
  const SEPARATORS = [',', ';', '\t'];

  /** The separator the header line uses most often; a comma when there is a tie. */
  function detectSeparator(text) {
    const header = text.split(/\r?\n/, 1)[0];
    return SEPARATORS.reduce((best, separator) => (header.split(separator).length > header.split(best).length ? separator : best), ',');
  }

  /**
   * @param {string} rawText
   * @returns {string[][]}  every line that has any text, as its trimmed cells; the header is the first row
   */
  function parseCsv(rawText) {
    const text = String(rawText).replace(BYTE_ORDER_MARK, '');
    const separator = detectSeparator(text);
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
        else if (char === '"') quoted = false;
        else cell += char;
      } else if (char === '"') {
        quoted = true;
      } else if (char === separator) {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[index + 1] === '\n') index += 1;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    row.push(cell);
    rows.push(row);
    return rows.map((cells) => cells.map((value) => value.trim())).filter((cells) => cells.some((value) => value !== ''));
  }

  return { parseCsv };
});
