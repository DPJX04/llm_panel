/* A rank such as "#2", marked "tie" when it is shared with another model. */
BenchPanel.define('components/RankLabel/RankLabel', ['components/dom', 'constants/rankingRules'], (dom, rankingRules) => {
  'use strict';

  /** @param {{ rank: number|null, tied?: boolean, prefix?: string }} props */
  function RankLabel(props) {
    if (props.rank === null) return dom.h('span', { className: 'muted', text: '—' });
    return dom.h('span', { className: 'rank-label' },
      `${props.prefix === undefined ? '#' : props.prefix}${props.rank}`,
      props.tied ? dom.h('span', { className: 'rank-label__tie', text: 'tie', title: `Within ${rankingRules.TIE_TOLERANCE_LABEL} of each other, which is inside normal run-to-run noise` }) : null);
  }

  return { RankLabel };
});
