/* The floating readout a chart shows on hover or keyboard focus. Values lead, names follow. */
BenchPanel.define('components/LineChart/chartTooltip', ['components/dom'], (dom) => {
  'use strict';

  const GAP_PX = 14;

  /** @param {HTMLElement} host  a positioned element the tooltip is placed inside */
  function createChartTooltip(host) {
    const node = dom.h('div', { className: 'chart-tooltip', role: 'status', hidden: true });
    host.appendChild(node);

    /**
     * @param {number} anchorX  pixels from the host's left edge
     * @param {string} heading
     * @param {Array<{ name: string, color: string, valueText: string }>} rows
     */
    function show(anchorX, heading, rows) {
      dom.clear(node);
      dom.append(node, [
        dom.h('div', { className: 'chart-tooltip__heading', text: heading }),
        rows.map((row) => dom.h('div', { className: 'chart-tooltip__row' },
          dom.h('span', { className: 'chart-tooltip__key', style: { background: row.color } }),
          dom.h('strong', { className: 'chart-tooltip__value', text: row.valueText }),
          dom.h('span', { className: 'chart-tooltip__name', text: row.name }))),
      ]);
      node.hidden = false;
      const fitsRight = anchorX + GAP_PX + node.offsetWidth <= host.clientWidth;
      node.style.left = `${fitsRight ? anchorX + GAP_PX : Math.max(0, anchorX - GAP_PX - node.offsetWidth)}px`;
    }

    function hide() {
      node.hidden = true;
    }

    return { show, hide };
  }

  return { createChartTooltip };
});
