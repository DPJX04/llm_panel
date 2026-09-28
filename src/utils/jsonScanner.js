/*
 * Splits text holding several JSON values written one after another ({..}{..}, one per line,
 * pretty-printed back to back, or comma separated) into one string per value.
 */
BenchPanel.define('utils/jsonScanner', [], () => {
  'use strict';

  const OPENERS = { '{': '}', '[': ']' };

  /**
   * @param {string} text
   * @returns {string[]}  each top-level object or array, in order
   * @throws {Error} when text outside the values is anything but whitespace or commas
   */
  function splitJsonValues(text) {
    const values = [];
    let index = 0;
    while (index < text.length) {
      const char = text[index];
      if (/[\s,]/.test(char)) { index += 1; continue; }
      if (!(char in OPENERS)) throw new Error(`Unexpected "${char}" at position ${index}`);
      const end = findValueEnd(text, index);
      values.push(text.slice(index, end + 1));
      index = end + 1;
    }
    return values;
  }

  /** Index of the bracket that closes the value opening at `start`, skipping brackets inside strings. */
  function findValueEnd(text, start) {
    const stack = [];
    let inString = false;
    for (let index = start; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (char === '\\') index += 1;
        else if (char === '"') inString = false;
      } else if (char === '"') {
        inString = true;
      } else if (char in OPENERS) {
        stack.push(OPENERS[char]);
      } else if (char === '}' || char === ']') {
        if (stack.pop() !== char) throw new Error(`Mismatched "${char}" at position ${index}`);
        if (stack.length === 0) return index;
      }
    }
    throw new Error('A JSON value is not closed; the file may be cut off');
  }

  return { splitJsonValues };
});
