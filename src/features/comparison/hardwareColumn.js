/* A DataTable column for a hardware number, with its unit, tie-tolerant best marking and a dash when missing. */
BenchPanel.define('features/comparison/hardwareColumn', [
  'components/dom', 'constants/rankingRules', 'utils/numberFormat',
], (dom, rankingRules, numberFormat) => {
  'use strict';

  /**
   * @param {{ label: string, title?: string, read: (row: Object) => number|null, decimals: number,
   *           unit?: string, better?: 'higher'|'lower', sub?: (row: Object) => string|null }} spec
   */
  function hardwareColumn(spec) {
    return {
      label: spec.label,
      title: spec.title,
      align: 'right',
      value: spec.read,
      better: spec.better,
      tieTolerance: rankingRules.TIE_TOLERANCE,
      render: (row) => {
        const value = spec.read(row);
        const text = numberFormat.formatWithUnit(value, spec.decimals, spec.unit);
        const sub = spec.sub ? spec.sub(row) : null;
        return sub ? dom.h('span', null, text, dom.h('span', { className: 'cell-sub', text: sub })) : text;
      },
    };
  }

  return { hardwareColumn };
});
