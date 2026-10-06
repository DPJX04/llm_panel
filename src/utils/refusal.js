/*
 * Spots a reply that declines to answer: "I don't know", "I'm not sure", "I cannot determine ...".
 * Only the opening of the reply is checked, where models put a refusal, so a full answer that later
 * says "the question does not mention X" still counts as an answer.
 */
BenchPanel.define('utils/refusal', [], () => {
  'use strict';

  const OPENING_CHARS = 300;
  const PATTERNS = [
    /\bi (?:do not|don't|dont) know\b/,
    /\bi(?:'m| am) (?:not sure|not certain|unsure|unable)\b/,
    /\b(?:cannot|can't|can not|unable to|not able to) (?:be )?(?:answer|answered|determine|determined|find|say|tell|provide|confirm|verify)\b/,
    /\b(?:insufficient|not enough) (?:information|context|data)\b/,
    /\bno (?:reliable |verified )?(?:information|record|data)\b/,
    /\b(?:is not|isn't|not) (?:known|available|publicly available)\b/,
  ];

  /** @param {string} answer */
  function looksLikeRefusal(answer) {
    const opening = String(answer || '').slice(0, OPENING_CHARS).toLowerCase().replace(/’/g, "'");
    return PATTERNS.some((pattern) => pattern.test(opening));
  }

  return { looksLikeRefusal };
});
