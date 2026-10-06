/*
 * Every question against every model: correct, wrong, declined, or no reply; with repeats, how many tries were
 * correct. The "Solved by" column shows which questions every model misses and which ones separate them.
 */
BenchPanel.define('features/accuracy/QuestionMatrix', [
  'components/dom', 'components/DataTable/DataTable', 'components/ModelTag/ModelTag', 'features/accuracy/OutcomeMark',
], (dom, dataTable, modelTag, outcomeMark) => {
  'use strict';

  const QUESTION_LENGTH = 90;

  function shorten(text) {
    return text.length > QUESTION_LENGTH ? `${text.slice(0, QUESTION_LENGTH - 1)}…` : text;
  }

  function outcomesFor(row, id) {
    return row.report.cases.filter((evalCase) => evalCase.id === id).map((evalCase) => evalCase.outcome);
  }

  /** Solved means correct on at least half of the tries; with one try, simply correct. */
  function solved(outcomes) {
    return outcomes.length > 0 && outcomes.filter((outcome) => outcome === 'correct').length * 2 >= outcomes.length;
  }

  function TriesMark(outcomes) {
    if (outcomes.length <= 1) return outcomeMark.OutcomeMark(outcomes[0] || null);
    const correct = outcomes.filter((outcome) => outcome === 'correct').length;
    const tone = correct === outcomes.length ? 'outcome-mark--correct' : correct === 0 ? 'outcome-mark--incorrect' : '';
    return dom.h('span', { className: `outcome-mark ${tone}`, title: `Correct on ${correct} of ${outcomes.length} tries`,
      text: `${correct}/${outcomes.length}` });
  }

  /** @param {{ rows: Object[] }} props  rows from resultRows */
  function QuestionMatrix(props) {
    const questions = [];
    props.rows.forEach((row) => row.report.cases.forEach((evalCase) => {
      if (!questions.some((known) => known.id === evalCase.id)) questions.push(evalCase);
    }));

    const columns = [
      { label: 'Question', render: (question) => dom.h('span', { className: 'accuracy-wrap', title: question.question },
        dom.h('span', { className: 'muted', text: `${question.id} · ` }), shorten(question.question)) },
      { label: 'Kind', render: (question) => dom.h('span', { className: 'muted', text: question.category }) },
      { label: 'Solved by', align: 'right', title: 'Models that got it right (with repeats: on at least half of the tries).',
        render: (question) => `${props.rows.filter((row) => solved(outcomesFor(row, question.id))).length} of ${props.rows.length}` },
      ...props.rows.map((row) => ({
        label: modelTag.ModelTag(row.model),
        render: (question) => TriesMark(outcomesFor(row, question.id)),
      })),
    ];
    return dataTable.DataTable({ columns, rows: questions, caption: 'Outcome of every question for every model' });
  }

  return { QuestionMatrix };
});
