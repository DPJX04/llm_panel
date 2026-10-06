/*
 * Checks which key facts a text contains. A fact is a list of spellings; any one of them counts.
 * A spelling must start on a word boundary ("tl1" is not inside "atl1"). One that ends in a digit must also end on
 * one, so "4" does not match "40"; a word stem such as "myth" may run on ("mythical").
 */
BenchPanel.define('utils/keyFacts', ['utils/textNormalize'], (textNormalize) => {
  'use strict';

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function spellingPresent(normalizedText, spelling) {
    const normalized = textNormalize.normalizeText(spelling);
    if (normalized === '') return false;
    const end = /[0-9]$/.test(normalized) ? '(?![a-z0-9])' : '';
    return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(normalized)}${end}`).test(normalizedText);
  }

  /** @param {string} text  @param {string[]} fact */
  function factPresent(text, fact) {
    const normalizedText = textNormalize.normalizeText(text);
    return fact.some((spelling) => spellingPresent(normalizedText, spelling));
  }

  /** @returns {string[][]} the facts the text does not contain */
  function missingFacts(text, facts) {
    return facts.filter((fact) => !factPresent(text, fact));
  }

  return { factPresent, missingFacts };
});
