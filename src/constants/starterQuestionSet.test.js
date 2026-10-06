(function () {
  'use strict';

  const questionSetParser = BenchPanel.require('services/questionSetParser');
  const grading = BenchPanel.require('utils/caseGrading');
  const keyFacts = BenchPanel.require('utils/keyFacts');
  const promptBuilder = BenchPanel.require('utils/promptBuilder');
  const { STARTER_QUESTION_SET } = BenchPanel.require('constants/starterQuestionSet');

  const questions = questionSetParser.parseQuestionSet(STARTER_QUESTION_SET).data.questions;

  test('starter set: every reference answer passes its own grading', () => {
    questions.forEach((question) => {
      const reply = question.kind === 'summary' || question.kind === 'short' ? question.reference : `Answer: ${question.reference}`;
      if (question.kind === 'short' && !question.answerable) return;
      const grade = grading.gradeReply(question, reply);
      assert.equal(grade.outcome, 'correct', `${question.id} reference graded ${grade.outcome}`);
      assert.ok(grade.formatFollowed, `${question.id} reference breaks its own format`);
    });
  });

  test('starter set: summary facts come from the passage, forbidden facts do not, and neither reaches the model', () => {
    questions.filter((question) => question.kind === 'summary').forEach((question) => {
      assert.equal(keyFacts.missingFacts(question.text, question.keyFacts).length, 0, `${question.id}: a key fact is not in the passage`);
      question.forbiddenFacts.forEach((fact) => assert.ok(!keyFacts.factPresent(question.text, fact), `${question.id}: forbidden ${fact[0]} is in the passage`));
      const prompt = promptBuilder.buildMessages(question)[0].content;
      assert.ok(prompt.includes(question.text) && !prompt.includes(question.reference), `${question.id}: prompt leaks the reference`);
    });
  });

  test('starter set: each classification passage gets its labels, never the answer line', () => {
    questions.filter((question) => question.kind === 'label').forEach((question) => {
      const prompt = promptBuilder.buildMessages(question)[0].content;
      assert.ok(question.choices.every((choice) => prompt.includes(choice)), `${question.id}: labels missing`);
      assert.ok(!prompt.includes(`Answer: ${question.reference}`), `${question.id}: prompt leaks the answer`);
    });
  });
})();
