(function () {
  'use strict';

  const { QuestionPreview } = BenchPanel.require('features/accuracy/QuestionPreview');
  const questionSetParser = BenchPanel.require('services/questionSetParser');
  const { STARTER_QUESTION_SET } = BenchPanel.require('constants/starterQuestionSet');

  const questions = questionSetParser.parseQuestionSet(STARTER_QUESTION_SET).data.questions;

  function cells(node, column) {
    return Array.from(node.querySelectorAll('tbody tr')).map((row) => row.children[column].textContent);
  }

  test('question preview: one row per question, with what the grader checks', () => {
    const picked = questions.filter((question) => ['x01', 'k05', 'u01'].includes(question.id));
    const node = QuestionPreview({ questions: picked, systemPrompt: '' });
    assert.equal(node.querySelectorAll('tbody tr').length, 3);
    const expected = cells(node, 3).join('\n');
    assert.ok(expected.includes('Must not mention: bank a / bank d'), 'forbidden facts shown');
    assert.ok(expected.includes('At most 60 words'), 'word limit shown');
    assert.ok(expected.includes('Should decline.'), 'false premise shown');
    assert.ok(cells(node, 2).join('\n').includes('Labels: IT / HR / Facilities / Finance'), 'labels shown');
  });

  test('question preview: the prompt column holds the system prompt and question, never the expected answer', () => {
    const summary = questions.find((question) => question.id === 'x02');
    const prompt = cells(QuestionPreview({ questions: [summary], systemPrompt: 'Be brief.' }), 4)[0];
    assert.ok(prompt.includes('[system]\nBe brief.'));
    assert.ok(prompt.includes(summary.text));
    assert.ok(!prompt.includes(summary.reference));
  });
})();
