/*
 * Columns grouped by ef search, one colour per database, each value written on top.
 * mark 'bar' draws bars from zero, because a bar's length is read as its value.
 * mark 'dot' draws dots on an axis that starts near the data, for values that sit close together such as recall:
 * as bars from zero, 97% and 99% would look the same.
 * Hover a group, or focus the chart and use the arrow keys, for every value in it.
 */
BenchPanel.define('features/vectorDb/GroupedColumnChart', [
  'components/dom', 'components/LineChart/chartTooltip', 'utils/chartScale',
], (dom, chartTooltip, chartScale) => {
  'use strict';

  const WIDTH = 640;
  const HEIGHT = 240;
  const MARGIN = { top: 24, right: 12, bottom: 34, left: 62 };
  const MAX_SLOT = 46;
  const GROUP_FILL = 0.8;
  const BAR_GAP = 2;
  const BAR_RADIUS = 4;
  const DOT_RADIUS = 6;
  // Narrower than this, the value text of neighbouring marks would overlap, so it is left to the tooltip and tables.
  const LABEL_MIN_SLOT = 28;

  /** A bar's outline: rounded top corners, square foot on the baseline. */
  function barPath(left, top, width, bottom) {
    const r = Math.min(BAR_RADIUS, width / 2, bottom - top);
    return `M${left} ${bottom}V${top + r}Q${left} ${top} ${left + r} ${top}H${left + width - r}`
      + `Q${left + width} ${top} ${left + width} ${top + r}V${bottom}Z`;
  }

  function Legend(series, mark) {
    return dom.h('figcaption', { className: 'chart-legend' }, series.map((line) =>
      dom.h('span', { className: 'chart-legend__item' },
        dom.h('span', { className: `chart-legend__key ${mark === 'dot' ? 'chart-legend__key--dot' : 'grouped-chart__key'}`, style: { background: dom.seriesColor(line.colorSlot) } }),
        line.name)));
  }

  /**
   * @param {Object} props
   * @param {Array<{ name: string, colorSlot: number }>} props.series
   * @param {Array<{ label: string, values: Array<number|null> }>} props.groups  values in series order
   * @param {'bar'|'dot'} props.mark
   * @param {(value: number) => string} props.formatValue  the text on top of each mark and in the tooltip
   * @param {(value: number) => string} props.formatTick
   * @param {string} props.ariaLabel
   */
  function GroupedColumnChart(props) {
    const values = props.groups.flatMap((group) => group.values).filter((value) => typeof value === 'number');
    if (values.length === 0) return dom.h('p', { className: 'hint', text: 'No values to chart.' });

    const ticks = props.mark === 'dot'
      ? chartScale.rangeTicks(Math.min(...values), Math.max(...values), 4)
      : chartScale.niceTicks(Math.max(...values), 4);
    const plotRight = WIDTH - MARGIN.right;
    const plotBottom = HEIGHT - MARGIN.bottom;
    const y = (value) => plotBottom - ((value - ticks[0]) / (ticks[ticks.length - 1] - ticks[0])) * (plotBottom - MARGIN.top);
    const groupWidth = (plotRight - MARGIN.left) / props.groups.length;
    const slot = Math.min(MAX_SLOT, (groupWidth * GROUP_FILL) / props.series.length);
    const groupLeft = (groupIndex) => MARGIN.left + groupWidth * groupIndex;
    const slotCenter = (groupIndex, seriesIndex) => groupLeft(groupIndex) + (groupWidth - slot * props.series.length) / 2 + slot * (seriesIndex + 0.5);

    const grid = ticks.map((tick, index) => dom.svg('g', null,
      dom.svg('line', { x1: MARGIN.left, x2: plotRight, y1: y(tick), y2: y(tick), className: index === 0 ? 'line-chart__baseline' : 'line-chart__grid' }),
      dom.svg('text', { x: MARGIN.left - 8, y: y(tick), className: 'line-chart__tick', 'text-anchor': 'end', 'dominant-baseline': 'middle', text: props.formatTick(tick) })));

    // One mark per database in each group, with its value on top when there is room for the text.
    const marks = props.groups.map((group, groupIndex) => dom.svg('g', null, group.values.map((value, seriesIndex) => {
      if (typeof value !== 'number') return null;
      const center = slotCenter(groupIndex, seriesIndex);
      const top = y(value);
      return dom.svg('g', { style: { '--mark-color': dom.seriesColor(props.series[seriesIndex].colorSlot) } },
        props.mark === 'dot'
          ? dom.svg('circle', { cx: center, cy: top, r: DOT_RADIUS, className: 'grouped-chart__dot' })
          : dom.svg('path', { d: barPath(center - (slot - BAR_GAP) / 2, top, slot - BAR_GAP, plotBottom), className: 'grouped-chart__bar' }),
        slot >= LABEL_MIN_SLOT ? dom.svg('text', {
          x: center, y: top - (props.mark === 'dot' ? DOT_RADIUS + 5 : 6), 'text-anchor': 'middle', className: 'grouped-chart__value', text: props.formatValue(value),
        }) : null);
    })));

    const groupLabels = props.groups.map((group, groupIndex) => dom.svg('text', {
      x: groupLeft(groupIndex) + groupWidth / 2, y: plotBottom + 20, className: 'line-chart__tick', 'text-anchor': 'middle', text: group.label,
    }));

    // A see-through column over each group catches the pointer for the tooltip.
    const hits = props.groups.map((group, groupIndex) => dom.svg('rect', {
      x: groupLeft(groupIndex), y: MARGIN.top, width: groupWidth, height: plotBottom - MARGIN.top, className: 'grouped-chart__hit',
    }));

    const chartSvg = dom.svg('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, className: 'line-chart__svg', role: 'img', 'aria-label': props.ariaLabel },
      grid, marks, groupLabels, hits);
    const plot = dom.h('div', { className: 'line-chart__plot', tabindex: '0' }, chartSvg);
    const tooltip = chartTooltip.createChartTooltip(plot);
    let activeIndex = null;

    function show(groupIndex) {
      activeIndex = groupIndex;
      const group = props.groups[groupIndex];
      const entries = props.series
        .map((line, seriesIndex) => ({ line, value: group.values[seriesIndex] }))
        .filter((entry) => typeof entry.value === 'number');
      const rows = entries.map((entry) => ({ name: entry.line.name, color: dom.seriesColor(entry.line.colorSlot), valueText: props.formatValue(entry.value) }));
      // Beside the group, level with its tallest mark: the SVG is drawn at WIDTH x HEIGHT and scaled to fit its box.
      const svgBox = chartSvg.getBoundingClientRect();
      const plotBox = plot.getBoundingClientRect();
      const groupX = svgBox.left - plotBox.left + (groupLeft(groupIndex) + groupWidth / 2) * (svgBox.width / WIDTH);
      const topY = svgBox.top - plotBox.top + Math.min(...entries.map((entry) => y(entry.value))) * (svgBox.height / HEIGHT);
      tooltip.show(groupX, group.label, rows, topY);
    }

    function hide() {
      activeIndex = null;
      tooltip.hide();
    }

    hits.forEach((hit, index) => {
      hit.addEventListener('pointerenter', () => show(index));
      hit.addEventListener('pointerleave', hide);
    });
    plot.addEventListener('focus', () => show(activeIndex === null ? 0 : activeIndex));
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      show(Math.min(props.groups.length - 1, Math.max(0, (activeIndex === null ? 0 : activeIndex) + step)));
    });

    return dom.h('figure', { className: 'line-chart' }, props.series.length >= 2 ? Legend(props.series, props.mark) : null, plot);
  }

  return { GroupedColumnChart };
});
