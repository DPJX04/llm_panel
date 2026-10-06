/*
 * One dot per model on two measures, e.g. accuracy against time per question.
 * Hover a dot, or focus the chart and use the arrow keys, to read its values.
 */
BenchPanel.define('components/ScatterChart/ScatterChart', [
  'components/dom', 'components/LineChart/chartTooltip', 'utils/chartScale',
], (dom, chartTooltip, chartScale) => {
  'use strict';

  const WIDTH = 640;
  const HEIGHT = 320;
  const MARGIN = { top: 16, right: 24, bottom: 46, left: 62 };
  const DOT_RADIUS = 6;
  const HIT_RADIUS = 16;
  const MAX_DIRECT_LABELS = 6;
  const LABEL_LENGTH = 18;

  function truncate(text, length) {
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  }

  /**
   * @param {Object} options
   * @param {Array<{ name: string, colorSlot: number, x: number|null, y: number|null }>} options.points
   * @param {string} options.xLabel
   * @param {string} options.yLabel
   * @param {number[]} [options.yTicks]          fixed y ticks, e.g. 0..1 for a rate; default fits the data
   * @param {(value: number) => string} options.formatX
   * @param {(value: number) => string} options.formatY
   * @param {(value: number) => string} options.formatTickX
   * @param {(value: number) => string} options.formatTickY
   * @param {string} options.ariaLabel
   */
  function ScatterChart(options) {
    const points = options.points.filter((point) => typeof point.x === 'number' && typeof point.y === 'number');
    const xTicks = chartScale.niceTicks(Math.max(0, ...points.map((point) => point.x)), 5);
    const yTicks = options.yTicks || chartScale.niceTicks(Math.max(0, ...points.map((point) => point.y)), 4);
    const xMax = xTicks[xTicks.length - 1];
    const yMax = yTicks[yTicks.length - 1];
    const plotRight = WIDTH - MARGIN.right;
    const plotBottom = HEIGHT - MARGIN.bottom;
    const x = (value) => MARGIN.left + (value / xMax) * (plotRight - MARGIN.left);
    const y = (value) => plotBottom - (value / yMax) * (plotBottom - MARGIN.top);

    const grid = yTicks.map((tick) => dom.svg('g', null,
      dom.svg('line', { x1: MARGIN.left, x2: plotRight, y1: y(tick), y2: y(tick), className: tick === 0 ? 'line-chart__baseline' : 'line-chart__grid' }),
      dom.svg('text', { x: MARGIN.left - 8, y: y(tick), className: 'line-chart__tick', 'text-anchor': 'end', 'dominant-baseline': 'middle', text: options.formatTickY(tick) })));
    const xAxis = xTicks.map((tick) => dom.svg('text', {
      x: x(tick), y: plotBottom + 20, className: 'line-chart__tick', 'text-anchor': 'middle', text: options.formatTickX(tick),
    }));

    const withLabels = points.length <= MAX_DIRECT_LABELS;
    const marks = points.map((point, index) => dom.svg('g', { className: 'scatter-chart__point', 'data-index': String(index), style: { '--dot-color': dom.seriesColor(point.colorSlot) } },
      dom.svg('circle', { cx: x(point.x), cy: y(point.y), r: HIT_RADIUS, className: 'scatter-chart__hit' }),
      dom.svg('circle', { cx: x(point.x), cy: y(point.y), r: DOT_RADIUS, className: 'scatter-chart__dot' }),
      withLabels ? dom.svg('text', {
        x: x(point.x) + (x(point.x) > plotRight - 120 ? -10 : 10),
        y: y(point.y) - 10,
        'text-anchor': x(point.x) > plotRight - 120 ? 'end' : 'start',
        className: 'scatter-chart__label',
        text: truncate(point.name, LABEL_LENGTH),
      }) : null));

    const chartSvg = dom.svg('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, className: 'line-chart__svg', role: 'img', 'aria-label': options.ariaLabel },
      grid, xAxis,
      dom.svg('text', { x: (MARGIN.left + plotRight) / 2, y: HEIGHT - 6, className: 'line-chart__axis-title', 'text-anchor': 'middle', text: options.xLabel }),
      dom.svg('text', { x: 14, y: (MARGIN.top + plotBottom) / 2, className: 'line-chart__axis-title', 'text-anchor': 'middle',
        transform: `rotate(-90 14 ${(MARGIN.top + plotBottom) / 2})`, text: options.yLabel }),
      marks);

    const plot = dom.h('div', { className: 'line-chart__plot', tabindex: points.length > 0 ? '0' : null }, chartSvg);
    const tooltip = chartTooltip.createChartTooltip(plot);
    let activeIndex = null;

    function show(index) {
      activeIndex = index;
      const point = points[index];
      marks.forEach((mark, markIndex) => mark.classList.toggle('is-active', markIndex === index));
      const svgBox = chartSvg.getBoundingClientRect();
      const offset = svgBox.left - plot.getBoundingClientRect().left;
      const color = dom.seriesColor(point.colorSlot);
      tooltip.show(offset + x(point.x) * (svgBox.width / WIDTH), point.name, [
        { name: options.yLabel, color, valueText: options.formatY(point.y) },
        { name: options.xLabel, color, valueText: options.formatX(point.x) },
      ]);
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
    plot.addEventListener('focus', () => { if (points.length > 0) show(activeIndex === null ? 0 : activeIndex); });
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      show(((activeIndex === null ? 0 : activeIndex + step) + points.length) % points.length);
    });

    const legend = points.length >= 2 ? dom.h('figcaption', { className: 'chart-legend' }, points.map((point) =>
      dom.h('span', { className: 'chart-legend__item' },
        dom.h('span', { className: 'chart-legend__key chart-legend__key--dot', style: { background: dom.seriesColor(point.colorSlot) } }),
        point.name))) : null;

    return dom.h('figure', { className: 'line-chart scatter-chart' }, legend, plot);
  }

  return { ScatterChart };
});
