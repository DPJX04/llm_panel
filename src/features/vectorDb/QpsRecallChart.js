/*
 * QPS against recall for one dataset: one line per database, one labelled point per ef search value.
 * Up and to the right is better. Both axes start near the data (not at zero) so close results stay apart.
 * Hover a point, or focus the chart and use the arrow keys, for its values.
 */
BenchPanel.define('features/vectorDb/QpsRecallChart', [
  'components/dom', 'components/LineChart/chartTooltip', 'utils/chartScale', 'utils/numberFormat',
], (dom, chartTooltip, chartScale, numberFormat) => {
  'use strict';

  const WIDTH = 640;
  const HEIGHT = 520;
  const MARGIN = { top: 16, right: 40, bottom: 46, left: 62 };
  const DOT_RADIUS = 5;
  const HIT_RADIUS = 14;
  const LABEL_OFFSET = 9;

  function efLabel(efSearch) {
    return efSearch === null ? 'ef not set' : `ef=${efSearch}`;
  }

  function Legend(lines) {
    return dom.h('figcaption', { className: 'chart-legend' }, lines.map((line) =>
      dom.h('span', { className: 'chart-legend__item' },
        dom.h('span', { className: 'chart-legend__key', style: { background: dom.seriesColor(line.colorSlot) } }),
        line.name)));
  }

  /**
   * @param {{ lines: Array<{ name: string, colorSlot: number, points: Array<{ efSearch: number|null, qps: number, recall: number }> }>,
   *   ariaLabel: string }} props  lines from dbResultCharts.tradeoffLines
   */
  function QpsRecallChart(props) {
    const points = props.lines.flatMap((line) => line.points.map((point) => ({ ...point, line })));
    if (points.length === 0) return dom.h('p', { className: 'hint', text: 'No run here has both QPS and recall.' });

    const recalls = points.map((point) => point.recall);
    const qpsValues = points.map((point) => point.qps);
    const xTicks = chartScale.rangeTicks(Math.min(...recalls), Math.max(...recalls), 5);
    const yTicks = chartScale.rangeTicks(Math.min(...qpsValues), Math.max(...qpsValues), 4);
    const plotRight = WIDTH - MARGIN.right;
    const plotBottom = HEIGHT - MARGIN.bottom;
    const x = (value) => MARGIN.left + ((value - xTicks[0]) / (xTicks[xTicks.length - 1] - xTicks[0])) * (plotRight - MARGIN.left);
    const y = (value) => plotBottom - ((value - yTicks[0]) / (yTicks[yTicks.length - 1] - yTicks[0])) * (plotBottom - MARGIN.top);

    const grid = yTicks.map((tick, index) => dom.svg('g', null,
      dom.svg('line', { x1: MARGIN.left, x2: plotRight, y1: y(tick), y2: y(tick), className: index === 0 ? 'line-chart__baseline' : 'line-chart__grid' }),
      dom.svg('text', { x: MARGIN.left - 8, y: y(tick), className: 'line-chart__tick', 'text-anchor': 'end', 'dominant-baseline': 'middle', text: numberFormat.formatTick(tick, {}) })));
    const xAxis = xTicks.map((tick) => dom.svg('text', {
      x: x(tick), y: plotBottom + 20, className: 'line-chart__tick', 'text-anchor': 'middle', text: numberFormat.formatTick(tick, { format: 'percent' }),
    }));

    // Each database's points joined in ef search order, so the line shows what raising ef costs and buys.
    const lines = props.lines.map((line) => dom.svg('path', {
      d: line.points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.recall).toFixed(1)} ${y(point.qps).toFixed(1)}`).join(' '),
      className: 'line-chart__line', style: { '--line-color': dom.seriesColor(line.colorSlot) },
    }));

    const marks = points.map((point) => {
      const nearRightEdge = x(point.recall) > plotRight - 60;
      return dom.svg('g', { className: 'qps-recall-chart__point', style: { '--line-color': dom.seriesColor(point.line.colorSlot) } },
        dom.svg('circle', { cx: x(point.recall), cy: y(point.qps), r: HIT_RADIUS, className: 'qps-recall-chart__hit' }),
        dom.svg('circle', { cx: x(point.recall), cy: y(point.qps), r: DOT_RADIUS, className: 'line-chart__dot' }),
        dom.svg('text', {
          x: x(point.recall) + (nearRightEdge ? -LABEL_OFFSET : LABEL_OFFSET),
          y: y(point.qps) - LABEL_OFFSET,
          'text-anchor': nearRightEdge ? 'end' : 'start',
          className: 'qps-recall-chart__label',
          text: efLabel(point.efSearch),
        }));
    });

    const chartSvg = dom.svg('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, className: 'line-chart__svg', role: 'img', 'aria-label': props.ariaLabel },
      grid, xAxis,
      dom.svg('text', { x: (MARGIN.left + plotRight) / 2, y: HEIGHT - 6, className: 'line-chart__axis-title', 'text-anchor': 'middle', text: 'Recall' }),
      dom.svg('text', { x: 14, y: (MARGIN.top + plotBottom) / 2, className: 'line-chart__axis-title', 'text-anchor': 'middle',
        transform: `rotate(-90 14 ${(MARGIN.top + plotBottom) / 2})`, text: 'QPS (queries per second)' }),
      lines, marks);

    const plot = dom.h('div', { className: 'line-chart__plot', tabindex: '0' }, chartSvg);
    const tooltip = chartTooltip.createChartTooltip(plot);
    let activeIndex = null;

    function show(index) {
      activeIndex = index;
      const point = points[index];
      const color = dom.seriesColor(point.line.colorSlot);
      marks.forEach((mark, markIndex) => mark.classList.toggle('is-active', markIndex === index));
      // The point's place in on-screen pixels: the SVG is drawn at WIDTH x HEIGHT and scaled to fit its box.
      const svgBox = chartSvg.getBoundingClientRect();
      const plotBox = plot.getBoundingClientRect();
      const pointX = svgBox.left - plotBox.left + x(point.recall) * (svgBox.width / WIDTH);
      const pointY = svgBox.top - plotBox.top + y(point.qps) * (svgBox.height / HEIGHT);
      tooltip.show(pointX, `${point.line.name} · ${efLabel(point.efSearch)}`, [
        { name: 'QPS', color, valueText: numberFormat.formatNumber(point.qps, 1) },
        { name: 'Recall', color, valueText: numberFormat.formatMetric(point.recall, { format: 'percent', decimals: 2 }) },
      ], pointY);
    }

    function hide() {
      activeIndex = null;
      marks.forEach((mark) => mark.classList.remove('is-active'));
      tooltip.hide();
    }

    marks.forEach((mark, index) => {
      mark.addEventListener('pointerenter', () => show(index));
      mark.addEventListener('pointerleave', hide);
    });
    plot.addEventListener('focus', () => show(activeIndex === null ? 0 : activeIndex));
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      show(((activeIndex === null ? 0 : activeIndex + step) + points.length) % points.length);
    });

    return dom.h('figure', { className: 'line-chart' }, props.lines.length >= 2 ? Legend(props.lines) : null, plot);
  }

  return { QpsRecallChart };
});
