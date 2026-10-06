/*
 * Reads the final answer out of a reply (a letter, a number or a label), the way simple-evals and lm-evaluation-harness do.
 * "Strict" means the reply used the format it was asked for ("Answer: B", "Answer: 42", or \boxed{42});
 * otherwise a looser fallback is tried, and the reply still scores, but counts as a format miss.
 * When the pattern appears more than once, the last one wins: models often restate options before answering.
 */
BenchPanel.define('utils/answerExtraction', [], () => {
  'use strict';

  const NUMBER = '-?\\d[\\d,]*(?:\\.\\d+)?|-?\\.\\d+';

  function lastMatch(text, pattern) {
    const matches = Array.from(text.matchAll(pattern));
    return matches.length > 0 ? matches[matches.length - 1][1] : null;
  }

  /**
   * @param {string} text
   * @param {string[]} letters  the valid option letters, e.g. ['A', 'B', 'C', 'D']
   * @returns {{ value: string|null, strict: boolean }}
   */
  function extractChoice(text, letters) {
    const set = letters.join('');
    const strict = lastMatch(text, new RegExp(`answer\\s*[:：]\\s*\\**\\s*\\(?\\s*([${set}])\\b`, 'gi'))
      || lastMatch(text, new RegExp(`\\\\boxed\\{\\s*\\(?([${set}])\\)?\\s*\\}`, 'g'));
    if (strict) return { value: strict.toUpperCase(), strict: true };
    const loose = lastMatch(text, new RegExp(`answer is\\s*\\**\\s*\\(?([${set}])\\b`, 'gi'))
      || (new RegExp(`^\\s*\\(?([${set}])\\)?[.)]?\\s*$`, 'i').exec(text) || [])[1];
    return { value: loose ? loose.toUpperCase() : null, strict: false };
  }

  function toNumber(text) {
    const value = Number(String(text).replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  }

  /** @returns {{ value: number|null, strict: boolean }} */
  function extractNumber(text) {
    const strict = lastMatch(text, new RegExp(`answer\\s*[:：]\\s*\\**\\s*\\$?\\s*(${NUMBER})`, 'gi'))
      || lastMatch(text, new RegExp(`\\\\boxed\\{\\s*\\$?(${NUMBER})`, 'g'));
    if (strict !== null) return { value: toNumber(strict), strict: true };
    const loose = lastMatch(text, new RegExp(`(${NUMBER})`, 'g'));
    return { value: loose === null ? null : toNumber(loose), strict: false };
  }

  function normalizeLabel(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  /**
   * Reads a classification label. Strict: the last "Answer: ..." line names a label (case and punctuation ignored).
   * Loose: the whole reply is a label, or exactly one label appears in it.
   * @param {string} text  @param {string[]} labels
   * @returns {{ value: string|null, strict: boolean }}  value is the label as the question spells it
   */
  function extractLabel(text, labels) {
    const byName = new Map(labels.map((label) => [normalizeLabel(label), label]));
    const line = lastMatch(text, /answer\s*[:：]\s*([^\n]+)/gi);
    if (line !== null) {
      const named = byName.get(normalizeLabel(line.replace(/[*_`"'“”]/g, '')));
      if (named) return { value: named, strict: true };
    }
    const whole = byName.get(normalizeLabel(text));
    if (whole) return { value: whole, strict: false };
    const padded = ` ${normalizeLabel(text)} `;
    const mentioned = labels.filter((label) => padded.includes(` ${normalizeLabel(label)} `));
    return { value: mentioned.length === 1 ? mentioned[0] : null, strict: false };
  }

  /** Equal up to rounding noise, so 625 and 625.0 agree. */
  function numbersEqual(a, b) {
    if (typeof a !== 'number' || typeof b !== 'number') return false;
    return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  }

  return { extractChoice, extractNumber, extractLabel, toNumber, numbersEqual };
});
