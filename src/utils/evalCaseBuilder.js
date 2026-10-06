/* Turns a question and the model's reply (or the error that stopped it) into one graded case of a report. */
BenchPanel.define('utils/evalCaseBuilder', ['utils/answerText', 'utils/caseGrading'], (answerText, caseGrading) => {
  'use strict';

  function questionFields(question, attempt) {
    return {
      id: question.id,
      attempt: attempt || 1,
      kind: question.kind,
      category: question.category,
      question: question.question,
      text: question.text || '',
      choices: question.choices,
      reference: question.reference,
      answerable: question.answerable,
      maxWords: question.maxWords ?? null,
    };
  }

  /**
   * @param {import('../types/questionSet').Question} question
   * @param {{ text: string, ttftMs: number|null, totalMs: number, inputTokens: number|null,
   *           outputTokens: number|null, finishReason: string|null }} reply
   * @param {number} [attempt]  which repeat this is, from 1
   */
  function buildCase(question, reply, attempt) {
    const answer = answerText.stripReasoning(reply.text);
    const grade = caseGrading.gradeReply(question, answer);
    return {
      ...questionFields(question, attempt),
      answer,
      outcome: grade.outcome,
      extracted: grade.extracted,
      formatFollowed: grade.formatFollowed,
      coverage: grade.coverage,
      rougeL: grade.rougeL,
      wordCount: grade.wordCount,
      error: null,
      totalMs: reply.totalMs,
      ttftMs: reply.ttftMs,
      inputTokens: reply.inputTokens,
      outputTokens: reply.outputTokens,
      finishReason: reply.finishReason,
    };
  }

  /** A question that got no reply. It is left out of accuracy and counted as an error. */
  function buildErrorCase(question, message, attempt) {
    return {
      ...questionFields(question, attempt),
      answer: '',
      outcome: 'error',
      extracted: null,
      formatFollowed: false,
      coverage: null,
      rougeL: null,
      wordCount: null,
      error: message,
      totalMs: null,
      ttftMs: null,
      inputTokens: null,
      outputTokens: null,
      finishReason: null,
    };
  }

  return { buildCase, buildErrorCase };
});
