/*
 * Grades one reply against its question's ground truth.
 *   choice / number / label: the extracted letter, number or label must equal the reference.
 *   short (answerable): every key fact must appear; a reply that declines is "not attempted".
 *   short (false premise): declining, or rejecting the premise, is the correct answer.
 *   summary: every key fact must appear and no forbidden (wrong) fact may; going over the word limit is a format miss.
 * A reply with no answer that reads as a refusal is "not attempted"; anything else is "incorrect".
 */
BenchPanel.define('utils/caseGrading', [
  'types/questionSet', 'utils/answerExtraction', 'utils/keyFacts', 'utils/refusal', 'utils/rougeL',
], (questionSet, answerExtraction, keyFacts, refusal, rougeL) => {
  'use strict';

  function missedOrDeclined(text) {
    return refusal.looksLikeRefusal(text) ? 'not-attempted' : 'incorrect';
  }

  function plain(outcome, extracted, formatFollowed) {
    return { outcome, extracted, formatFollowed, coverage: null, rougeL: null, wordCount: null };
  }

  function gradeChoice(question, text) {
    const letters = questionSet.CHOICE_LETTERS.slice(0, question.choices.length);
    const found = answerExtraction.extractChoice(text, letters);
    const outcome = found.value === question.reference.toUpperCase() ? 'correct'
      : found.value === null ? missedOrDeclined(text) : 'incorrect';
    return plain(outcome, found.value, found.strict);
  }

  function gradeNumber(question, text) {
    const found = answerExtraction.extractNumber(text);
    const outcome = answerExtraction.numbersEqual(found.value, answerExtraction.toNumber(question.reference)) ? 'correct'
      : found.value === null ? missedOrDeclined(text) : 'incorrect';
    return plain(outcome, found.value === null ? null : String(found.value), found.strict);
  }

  function gradeLabel(question, text) {
    const found = answerExtraction.extractLabel(text, question.choices);
    const outcome = found.value === question.reference ? 'correct'
      : found.value === null ? missedOrDeclined(text) : 'incorrect';
    return plain(outcome, found.value, found.strict);
  }

  function gradeShort(question, text) {
    if (!question.answerable) {
      const declined = refusal.looksLikeRefusal(text) || question.declineFacts.some((fact) => keyFacts.factPresent(text, fact));
      return plain(declined ? 'correct' : 'incorrect', null, true);
    }
    const facts = question.keyFacts.length > 0 ? question.keyFacts : [[question.reference]];
    return plain(keyFacts.missingFacts(text, facts).length === 0 ? 'correct' : missedOrDeclined(text), null, true);
  }

  function gradeSummary(question, text) {
    const missing = keyFacts.missingFacts(text, question.keyFacts).length;
    const invented = question.forbiddenFacts.some((fact) => keyFacts.factPresent(text, fact));
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const outcome = text.trim() === '' ? 'incorrect'
      : invented ? 'incorrect'
        : missing === 0 ? 'correct'
          : missedOrDeclined(text);
    return {
      outcome,
      extracted: null,
      formatFollowed: question.maxWords === null || wordCount <= question.maxWords,
      coverage: (question.keyFacts.length - missing) / question.keyFacts.length,
      rougeL: rougeL.rougeL(text, question.reference),
      wordCount,
    };
  }

  const GRADERS = { choice: gradeChoice, number: gradeNumber, label: gradeLabel, short: gradeShort, summary: gradeSummary };

  /**
   * @param {import('../types/questionSet').Question} question
   * @param {string} answerText  the reply with reasoning removed
   * @returns {{ outcome: 'correct'|'incorrect'|'not-attempted', extracted: string|null, formatFollowed: boolean,
   *   coverage: number|null, rougeL: number|null, wordCount: number|null }}  the last three for summaries only
   */
  function gradeReply(question, answerText) {
    return GRADERS[question.kind](question, String(answerText || ''));
  }

  return { gradeReply };
});
