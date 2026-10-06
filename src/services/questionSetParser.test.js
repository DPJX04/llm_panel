(function () {
  'use strict';

  const parser = BenchPanel.require('services/questionSetParser');
  const { STARTER_QUESTION_SET } = BenchPanel.require('constants/starterQuestionSet');

  function set(questions) {
    return { kind: 'llm-question-set', id: 'mine', title: 'Mine', questions };
  }

  test('question set: the built-in starter set is valid and its ids are unique', () => {
    const parsed = parser.parseQuestionSet(STARTER_QUESTION_SET);
    assert.ok(parsed.ok, parsed.error);
    const count = parsed.data.questions.length;
    assert.equal(count, 52);
    assert.equal(new Set(parsed.data.questions.map((question) => question.id)).size, count);
  });

  test('question set: defaults are filled and references are normalised', () => {
    const parsed = parser.parseQuestionSet(set([
      { id: 1, kind: 'choice', question: 'Pick', choices: ['a', 'b'], reference: 'b' },
      { id: 'n', kind: 'number', question: 'Count', reference: '7,260' },
      { id: 's', kind: 'short', question: 'Name', reference: 'Iron', keyFacts: ['iron', ['fe', 'ferrum']] },
    ]));
    assert.ok(parsed.ok, parsed.error);
    const [choice, number, short] = parsed.data.questions;
    assert.equal(choice.id, '1');
    assert.equal(choice.reference, 'B');
    assert.equal(choice.category, 'general');
    assert.equal(number.reference, '7260');
    assert.deepEqual(short.keyFacts, [['iron'], ['fe', 'ferrum']]);
    assert.equal(short.answerable, true);
  });

  test('question set: classification labels keep their spelling; summaries keep facts and word limit', () => {
    const parsed = parser.parseQuestionSet(set([
      { id: 'k', kind: 'label', question: 'Which team?', labels: ['IT', 'Facilities'], text: 'The lift is broken.', reference: 'facilities' },
      { id: 'x', kind: 'summary', question: 'Summarize.', text: 'Long text.', reference: 'Short.', keyFacts: ['pump'], forbiddenFacts: [['bank a']], maxWords: 40 },
    ]));
    assert.ok(parsed.ok, parsed.error);
    const [label, summary] = parsed.data.questions;
    assert.deepEqual([label.choices, label.reference, label.text], [['IT', 'Facilities'], 'Facilities', 'The lift is broken.']);
    assert.deepEqual([summary.keyFacts, summary.forbiddenFacts, summary.maxWords], [[['pump']], [['bank a']], 40]);
  });

  test('question set: classification and summary questions need their passage, labels and facts', () => {
    const cases = [
      [set([{ id: 'k', kind: 'label', question: 'Q', labels: ['a', 'b'], reference: 'a' }]), /needs the text to classify/],
      [set([{ id: 'k', kind: 'label', question: 'Q', labels: ['a', 'A'], text: 't', reference: 'a' }]), /labels must be different/],
      [set([{ id: 'k', kind: 'label', question: 'Q', labels: ['a', 'b'], text: 't', reference: 'c' }]), /reference must be one of the labels/],
      [set([{ id: 'x', kind: 'summary', question: 'Q', text: 't', reference: 'r' }]), /needs keyFacts/],
      [set([{ id: 'x', kind: 'summary', question: 'Q', text: 't', keyFacts: ['f'], maxWords: 2 }]), /maxWords/],
    ];
    cases.forEach(([input, pattern]) => {
      const parsed = parser.parseQuestionSet(input);
      assert.ok(!parsed.ok && pattern.test(parsed.error), `expected ${pattern}, got ${parsed.error}`);
    });
  });

  test('question set: a bad question is rejected with its position', () => {
    const cases = [
      [set([{ id: 'a', kind: 'choice', question: 'Pick', choices: ['x', 'y'], reference: 'C' }]), /Question 1: a: reference must be one of the letters A, B/],
      [set([{ id: 'a', kind: 'number', question: 'Count', reference: 'many' }]), /reference must be a number/],
      [set([{ id: 'a', kind: 'essay', question: 'Write' }]), /kind must be/],
      [set([{ id: 'a', kind: 'number', question: 'x', reference: 1 }, { id: 'a', kind: 'number', question: 'y', reference: 2 }]), /used twice/],
      [{ kind: 'something-else', id: 'x', questions: [] }, /Not a question set/],
    ];
    cases.forEach(([input, pattern]) => {
      const parsed = parser.parseQuestionSet(input);
      assert.ok(!parsed.ok && pattern.test(parsed.error), `expected ${pattern}, got ${parsed.error}`);
    });
  });

  test('question set: text that is not JSON names the file', () => {
    const parsed = parser.parseQuestionSetText('{ nope', 'questions.json');
    assert.ok(!parsed.ok && parsed.error.startsWith('questions.json:'));
  });
})();
