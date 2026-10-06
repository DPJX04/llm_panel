/*
 * ROUGE-L, the standard overlap score for summaries: the longest run of words the summary and the reference share in
 * order (not necessarily side by side), as an F-score from 0 to 1. It rewards wording close to the reference, so read it
 * beside key-fact coverage, which rewards getting the facts right in any words.
 */
BenchPanel.define('utils/rougeL', ['utils/textNormalize'], (textNormalize) => {
  'use strict';

  function words(text) {
    const normalized = textNormalize.normalizeText(text);
    return normalized === '' ? [] : normalized.split(' ');
  }

  /** Length of the longest common subsequence, keeping only two rows of the table. */
  function lcsLength(a, b) {
    let previous = new Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i += 1) {
      const current = new Array(b.length + 1).fill(0);
      for (let j = 1; j <= b.length; j += 1) {
        current[j] = a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
      }
      previous = current;
    }
    return previous[b.length];
  }

  /** @returns {number|null} null when there is no reference to compare with */
  function rougeL(candidate, reference) {
    const referenceWords = words(reference);
    if (referenceWords.length === 0) return null;
    const candidateWords = words(candidate);
    if (candidateWords.length === 0) return 0;
    const common = lcsLength(candidateWords, referenceWords);
    if (common === 0) return 0;
    const precision = common / candidateWords.length;
    const recall = common / referenceWords.length;
    return (2 * precision * recall) / (precision + recall);
  }

  return { rougeL };
});
