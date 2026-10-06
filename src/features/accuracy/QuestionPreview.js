/*
 * The questions a run will ask, before it starts: each question with its passage and options, what the grader
 * expects, and the exact prompt the model receives (which never holds the expected answer).
 */
BenchPanel.define('features/accuracy/QuestionPreview', [
  'components/dom', 'components/DataTable/DataTable', 'types/questionSet', 'utils/promptBuilder',
], (dom, dataTable, questionSet, promptBuilder) => {
  'use strict';

  // A long set would make a very long page; the rest are counted, and the filter narrows the list.
  const MAX_ROWS = 200;

  function factsText(facts) {
    return facts.map((fact) => fact.join(' / ')).join(' · ');
  }

  function Disclosure(label, text) {
    return dom.h('details', { className: 'accuracy-answer' },
      dom.h('summary', { className: 'muted', text: label }),
      dom.h('pre', { className: 'accuracy-answer__text', text }));
  }

  function questionCell(question) {
    let options = null;
    if (question.kind === 'choice') {
      options = question.choices.map((choice, index) => `${questionSet.CHOICE_LETTERS[index]}) ${choice}`).join('   ');
    } else if (question.kind === 'label') {
      options = `Labels: ${question.choices.join(' / ')}`;
    }
    return dom.h('div', { className: 'accuracy-wrap' },
      dom.h('div', { text: question.question }),
      question.text ? Disclosure('Show text', question.text) : null,
      options ? dom.h('div', { className: 'muted accuracy-choices', text: options }) : null);
  }

  /** The reference, plus what the grader checks beyond it. */
  function expectedCell(question) {
    const lines = [];
    if (question.kind === 'short' && !question.answerable) {
      lines.push(`Should decline. ${question.reference}`);
      if (question.declineFacts.length > 0) lines.push(`Counts as declining: ${factsText(question.declineFacts)}`);
    } else {
      if (question.reference) lines.push(question.kind === 'summary' ? `Reference: ${question.reference}` : question.reference);
      if (question.keyFacts.length > 0) lines.push(`Must mention: ${factsText(question.keyFacts)}`);
      if (question.forbiddenFacts.length > 0) lines.push(`Must not mention: ${factsText(question.forbiddenFacts)}`);
      if (question.maxWords) lines.push(`At most ${question.maxWords} words`);
    }
    return dom.h('div', { className: 'accuracy-wrap' }, lines.map((line, index) =>
      dom.h('div', { className: index === 0 ? null : 'muted accuracy-choices', text: line })));
  }

  function promptCell(question, systemPrompt) {
    const text = promptBuilder.buildMessages(question, systemPrompt)
      .map((message) => `[${message.role}]\n${message.content}`).join('\n\n');
    return Disclosure('Show prompt', text);
  }

  /** @param {{ questions: Object[], systemPrompt: string }} props  the questions the run would ask */
  function QuestionPreview(props) {
    const shown = props.questions.slice(0, MAX_ROWS);
    const columns = [
      { label: '#', render: (question) => dom.h('span', { className: 'muted', text: question.id }) },
      { label: 'Kind', render: (question) => dom.h('div', null,
        dom.h('div', { text: question.kind }), dom.h('div', { className: 'muted', text: question.category })) },
      { label: 'Question', render: questionCell },
      { label: 'Expected (never sent)', render: expectedCell },
      { label: 'What the model receives', render: (question) => promptCell(question, props.systemPrompt) },
    ];
    return dom.h('div', { className: 'accuracy-preview' },
      dataTable.DataTable({ columns, rows: shown, caption: 'Questions this run will ask' }),
      props.questions.length > MAX_ROWS
        ? dom.h('p', { className: 'hint', text: `Showing the first ${MAX_ROWS} of ${props.questions.length}. Untick kinds or categories to see others.` })
        : null);
  }

  return { QuestionPreview };
});
