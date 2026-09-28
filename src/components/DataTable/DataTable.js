/*
 * A comparison table. Columns that declare `better` get their best value bolded,
 * and optionally their worst value flagged, so the winner of each column stands out.
 */
BenchPanel.define('components/DataTable/DataTable', ['components/dom', 'utils/ranking'], (dom, ranking) => {
  'use strict';

  /**
   * @typedef {Object} Column
   * @property {string} label
   * @property {string} [title]           header tooltip, e.g. what the metric means
   * @property {'left'|'right'} [align]
   * @property {(row: any) => (string|Node)} render
   * @property {(row: any) => (number|null)} [value]   needed for best/worst marking
   * @property {'higher'|'lower'} [better]
   * @property {boolean} [markWorst]
   */

  function highlightFor(column, rows) {
    if (!column.better || !column.value) return null;
    const values = rows.map(column.value);
    if (values.filter((value) => typeof value === 'number').length < 2) return null;
    const extremes = ranking.extremes(values, column.better);
    // When every row ties there is no winner to point out.
    return extremes.best === extremes.worst ? null : extremes;
  }

  function cellClass(column, value, highlight) {
    const classes = [column.align === 'right' ? 'is-numeric' : ''];
    if (highlight && value !== null && value !== undefined) {
      if (value === highlight.best) classes.push('is-best');
      else if (column.markWorst && value === highlight.worst) classes.push('is-worst');
    }
    return classes.filter(Boolean).join(' ');
  }

  /**
   * @param {{ columns: Column[], rows: any[], caption?: string, rowClass?: (row: any) => string }} options
   */
  function DataTable(options) {
    const { columns, rows, caption, rowClass } = options;
    const highlights = columns.map((column) => highlightFor(column, rows));

    const head = dom.h('thead', null, dom.h('tr', null, columns.map((column) =>
      dom.h('th', { scope: 'col', className: column.align === 'right' ? 'is-numeric' : '', title: column.title }, column.label))));

    const body = dom.h('tbody', null, rows.map((row) => dom.h('tr', { className: rowClass ? rowClass(row) : null },
      columns.map((column, index) => {
        const value = column.value ? column.value(row) : null;
        return dom.h('td', { className: cellClass(column, value, highlights[index]) }, column.render(row));
      }))));

    return dom.h('div', { className: 'data-table' },
      dom.h('table', { 'aria-label': caption }, head, body));
  }

  return { DataTable };
});
