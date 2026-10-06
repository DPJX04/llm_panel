(function () {
  'use strict';

  const promptBuilder = BenchPanel.require('utils/promptBuilder');
  const answerText = BenchPanel.require('utils/answerText');
  const questionSetParser = BenchPanel.require('services/questionSetParser');
  const { STARTER_QUESTION_SET } = BenchPanel.require('constants/starterQuestionSet');

  test('prompt: multiple choice lists lettered options and asks for "Answer: LETTER"', () => {
    const [message] = promptBuilder.buildMessages({ kind: 'choice', question: 'Pick one.', choices: ['x', 'y', 'z'] });
    assert.equal(message.role, 'user');
    assert.ok(message.content.includes('A) x\nB) y\nC) z'));
    assert.ok(message.content.includes('"Answer: LETTER", where LETTER is one of A, B, C'));
  });

  test('prompt: the model never sees the reference answer or key facts of a short question', () => {
    const set = questionSetParser.parseQuestionSet(STARTER_QUESTION_SET);
    assert.ok(set.ok, set.error);
    set.data.questions.filter((question) => question.kind === 'short').forEach((question) => {
      const content = promptBuilder.buildMessages(question)[0].content.toLowerCase();
      assert.ok(content.includes(question.question.toLowerCase()), `${question.id} includes its question`);
      assert.ok(!content.includes(question.reference.toLowerCase()), `${question.id} leaks its reference`);
    });
  });

  test('answer text: reasoning blocks are removed before grading', () => {
    assert.equal(answerText.stripReasoning('<think>maybe B</think>\nAnswer: A'), 'Answer: A');
    assert.equal(answerText.stripReasoning('maybe B, no...</think>Answer: C'), 'Answer: C');
    assert.equal(answerText.stripReasoning('Answer: D'), 'Answer: D');
  });
})();
