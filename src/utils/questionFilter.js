/*
 * Picks the questions a run asks: leave out kinds or categories, and optionally keep only the first N.
 * A run on part of a set is filed apart from the full set, so a quick check never replaces a full run.
 */
BenchPanel.define('utils/questionFilter', ['types/questionSet'], (questionSet) => {
  'use strict';

  /** The set's categories in first-seen order, each with its question count. */
  function categoriesOf(set) {
    const counts = new Map();
    set.questions.forEach((question) => counts.set(question.category, (counts.get(question.category) || 0) + 1));
    return Array.from(counts, ([category, count]) => ({ category, count }));
  }

  /** The kinds the set uses, in the standard order, each with its question count. */
  function kindsOf(set) {
    return questionSet.QUESTION_KINDS
      .map((kind) => ({ kind, count: set.questions.filter((question) => question.kind === kind).length }))
      .filter((entry) => entry.count > 0);
  }

  /**
   * @param {import('../types/questionSet').QuestionSet} set
   * @param {{ excludedKinds: string[], excludedCategories: string[], limit: number|null }} filter
   * @returns {{ questions: Object[], subset: { key: string, label: string }|null }}  subset is null when every question is asked
   */
  function filterQuestions(set, filter) {
    const kinds = kindsOf(set).map((entry) => entry.kind).filter((kind) => !filter.excludedKinds.includes(kind));
    const categories = categoriesOf(set).map((entry) => entry.category).filter((category) => !filter.excludedCategories.includes(category));
    const picked = set.questions.filter((question) => kinds.includes(question.kind) && categories.includes(question.category));
    const questions = filter.limit ? picked.slice(0, filter.limit) : picked;
    if (questions.length === set.questions.length) return { questions, subset: null };

    const parts = [];
    if (kinds.length < kindsOf(set).length) parts.push(kinds.join(', '));
    if (categories.length < categoriesOf(set).length) parts.push(categories.join(', '));
    if (filter.limit && filter.limit < picked.length) parts.push(`first ${filter.limit}`);
    const label = parts.join(' · ');
    return { questions, subset: { key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), label } };
  }

  return { categoriesOf, kindsOf, filterQuestions };
});
