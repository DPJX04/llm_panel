(function () {
  'use strict';

  const questionFilter = BenchPanel.require('utils/questionFilter');

  const set = { id: 'set', title: 'Set', questions: [
    { id: 'm1', kind: 'number', category: 'math' },
    { id: 'm2', kind: 'number', category: 'math' },
    { id: 'c1', kind: 'choice', category: 'science' },
    { id: 's1', kind: 'short', category: 'science' },
  ] };
  const none = { excludedKinds: [], excludedCategories: [], limit: null };

  test('question filter: everything picked is the whole set, with no subset', () => {
    const plan = questionFilter.filterQuestions(set, none);
    assert.equal(plan.questions.length, 4);
    assert.equal(plan.subset, null);
    assert.deepEqual(questionFilter.categoriesOf(set), [{ category: 'math', count: 2 }, { category: 'science', count: 2 }]);
    assert.deepEqual(questionFilter.kindsOf(set).map((entry) => entry.kind), ['choice', 'number', 'short']);
  });

  test('question filter: leaving out kinds or categories, or keeping the first N, names the subset', () => {
    const science = questionFilter.filterQuestions(set, { ...none, excludedCategories: ['math'] });
    assert.deepEqual(science.questions.map((question) => question.id), ['c1', 's1']);
    assert.deepEqual(science.subset, { key: 'science', label: 'science' });

    const firstThree = questionFilter.filterQuestions(set, { ...none, limit: 3 });
    assert.deepEqual(firstThree.subset, { key: 'first-3', label: 'first 3' });

    const mixed = questionFilter.filterQuestions(set, { excludedKinds: ['short'], excludedCategories: [], limit: 2 });
    assert.deepEqual(mixed.questions.map((question) => question.id), ['m1', 'm2']);
    assert.equal(mixed.subset.label, 'choice, number · first 2');
  });

  test('question filter: a limit at or above the picked count is no subset', () => {
    assert.equal(questionFilter.filterQuestions(set, { ...none, limit: 10 }).subset, null);
  });
})();
