/**
 * Question sets for the accuracy evaluation. Ground truth stays in the panel: only the question, its options and its
 * passage are sent to the model.
 *
 * Five kinds, graded the way public benchmarks grade them:
 *   choice   multiple choice, MMLU style; the model ends with "Answer: LETTER"
 *   number   a worked problem, GSM8K style; the final number is compared exactly
 *   short    a short factual answer, SimpleQA style; correct, incorrect, or not attempted
 *   label    classification: pick one label for a passage; the model ends with "Answer: LABEL"
 *   summary  summarise a passage within a word limit; every key fact must appear and no forbidden (wrong) fact may
 *
 * @typedef {string[]} KeyFact  alternative spellings; any one counts as the fact being present
 *
 * @typedef {Object} Question
 * @property {string} id
 * @property {'choice'|'number'|'short'|'label'|'summary'} kind
 * @property {string} category        groups questions in the results, e.g. "math"
 * @property {string} question        the instruction, e.g. "Which team should handle this ticket?"
 * @property {string} text            label and summary: the passage to classify or summarise; empty otherwise
 * @property {string[]} choices        choice: options in letter order (A, B, C, ...); label: the label names
 * @property {string} reference        the correct answer: a letter, a number, a label, or text (a reference summary)
 * @property {KeyFact[]} keyFacts      short and summary: every fact must appear for a correct answer
 * @property {KeyFact[]} forbiddenFacts  summary: wrong details that mark the summary incorrect if they appear
 * @property {number|null} maxWords    summary: word limit; going over counts as a format miss
 * @property {boolean} answerable      short only: false for a false-premise question the model should decline
 * @property {KeyFact[]} declineFacts  short only: phrases that show the model rejected a false premise
 *
 * @typedef {Object} QuestionSet
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {Question[]} questions
 */
BenchPanel.define('types/questionSet', [], () => {
  'use strict';

  const QUESTION_SET_KIND = 'llm-question-set';
  const QUESTION_KINDS = Object.freeze(['choice', 'number', 'short', 'label', 'summary']);
  const CHOICE_LETTERS = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  const MAX_LABELS = 20;

  return { QUESTION_SET_KIND, QUESTION_KINDS, CHOICE_LETTERS, MAX_LABELS };
});
