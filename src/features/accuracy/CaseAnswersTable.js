/* One model's answer to every question beside the expected answer, so a score can be checked by eye. */
BenchPanel.define('features/accuracy/CaseAnswersTable', [
  'components/dom', 'components/DataTable/DataTable', 'features/accuracy/OutcomeMark', 'types/questionSet', 'utils/numberFormat',
], (dom, dataTable, outcomeMark, questionSet, numberFormat) => {
  'use strict';

  function optionsLine(evalCase) {
    if (evalCase.choices.length === 0) return null;
    const text = evalCase.kind === 'label'
      ? `Labels: ${evalCase.choices.join(' / ')}`
      : evalCase.choices.map((choice, index) => `${questionSet.CHOICE_LETTERS[index]}) ${choice}`).join('   ');
    return dom.h('div', { className: 'muted accuracy-choices', text });
  }

  function questionCell(evalCase) {
    return dom.h('div', { className: 'accuracy-wrap' },
      dom.h('div', { text: evalCase.maxWords ? `${evalCase.question} (at most ${evalCase.maxWords} words)` : evalCase.question }),
      evalCase.text ? dom.h('details', { className: 'accuracy-answer' },
        dom.h('summary', { className: 'muted', text: 'Show text' }),
        dom.h('pre', { className: 'accuracy-answer__text', text: evalCase.text })) : null,
      optionsLine(evalCase));
  }

  function expectedCell(evalCase) {
    if (!evalCase.answerable) return dom.h('span', { className: 'accuracy-wrap', text: `Should decline. ${evalCase.reference}` });
    return dom.h('span', { className: 'accuracy-wrap', text: evalCase.reference });
  }

  /** The one-line reading of a reply: what was extracted, or for a summary its scores. */
  function readingOf(evalCase) {
    if (evalCase.kind === 'summary') {
      const parts = [`Covers ${numberFormat.formatMetric(evalCase.coverage, { format: 'percent', decimals: 0 })} of key facts`];
      if (evalCase.wordCount !== null) parts.push(`${evalCase.wordCount} words${evalCase.maxWords ? ` of ${evalCase.maxWords}` : ''}`);
      if (evalCase.rougeL !== null) parts.push(`ROUGE-L ${numberFormat.formatNumber(evalCase.rougeL, 2)}`);
      return parts.join(' · ');
    }
    if (evalCase.extracted !== null) return `Read as ${evalCase.extracted}`;
    return evalCase.kind === 'short' ? 'Show reply' : 'No answer found';
  }

  function answerCell(evalCase) {
    if (evalCase.error) return dom.h('span', { className: 'status-flag status-flag--warning accuracy-wrap', text: evalCase.error });
    const notes = [];
    if (evalCase.kind === 'summary' && !evalCase.formatFollowed) notes.push('over the word limit');
    else if (evalCase.kind !== 'short' && evalCase.kind !== 'summary' && !evalCase.formatFollowed && evalCase.extracted !== null) notes.push('format not followed');
    if (evalCase.finishReason === 'length') notes.push('cut off at the token limit');
    return dom.h('details', { className: 'accuracy-answer' },
      dom.h('summary', null, readingOf(evalCase), notes.length > 0 ? dom.h('span', { className: 'muted', text: ` (${notes.join(', ')})` }) : null),
      dom.h('pre', { className: 'accuracy-answer__text', text: evalCase.answer || '(empty reply)' }));
  }
  /** @param {{ report: Object }} props */
  function CaseAnswersTable(props) {
    const withRepeats = props.report.cases.some((evalCase) => evalCase.attempt > 1);
    const columns = [
      { label: '#', render: (evalCase) => dom.h('span', { className: 'muted', text: evalCase.id }) },
      withRepeats ? { label: 'Try', align: 'right', render: (evalCase) => String(evalCase.attempt) } : null,
      { label: 'Question', render: questionCell },
      { label: 'Expected', render: expectedCell },
      { label: 'Result', render: (evalCase) => outcomeMark.OutcomeMark(evalCase.outcome) },
      { label: 'Answer', render: answerCell },
      { label: 'Time', align: 'right', render: (evalCase) => numberFormat.formatMetric(evalCase.totalMs, { format: 'seconds', decimals: 1 }) },
      { label: 'Tokens', align: 'right', render: (evalCase) => numberFormat.formatNumber(evalCase.outputTokens, 0) },
    ];
    return dataTable.DataTable({ columns: columns.filter(Boolean), rows: props.report.cases, caption: 'Answers' });
  }

  return { CaseAnswersTable };
});
