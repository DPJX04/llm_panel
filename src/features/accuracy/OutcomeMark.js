/* A question's outcome as a symbol plus a hidden word, so it never rests on colour or shape alone. */
BenchPanel.define('features/accuracy/OutcomeMark', ['components/dom'], (dom) => {
  'use strict';

  const MARKS = {
    correct: { symbol: '✓', label: 'Correct', className: 'outcome-mark--correct' },
    incorrect: { symbol: '✕', label: 'Wrong', className: 'outcome-mark--incorrect' },
    'not-attempted': { symbol: '–', label: 'Declined', className: 'outcome-mark--declined' },
    error: { symbol: '!', label: 'No reply', className: 'outcome-mark--error' },
  };

  /** @param {string|null} outcome */
  function OutcomeMark(outcome) {
    const mark = MARKS[outcome];
    if (!mark) return dom.h('span', { className: 'muted', text: '—' });
    return dom.h('span', { className: `outcome-mark ${mark.className}`, title: mark.label },
      dom.h('span', { 'aria-hidden': 'true', text: mark.symbol }),
      dom.h('span', { className: 'visually-hidden', text: mark.label }));
  }

  return { OutcomeMark };
});
