/*
 * A metric across concurrency levels, one line per model.
 * Levels are evenly spaced (1, 2, 4, 8, 16 read as equal steps). Hover or arrow keys show every model's value.
 */
BenchPanel.define('components/LineChart/LineChart', [
  'components/dom', 'components/LineChart/chartTooltip', 'utils/chartScale',
], (dom, chartTooltip, chartScale) => {
  'use strict';

  const WIDTH = 640;
  const HEIGHT = 300;
  const MARGIN = { top: 16, bottom: 46, left: 62 };
  const RIGHT_PLAIN = 20;
  const RIGHT_WITH_LABELS = 128;
  const INNER_PAD = 18;
  const MIN_LABEL_GAP = 14;
  const MAX_DIRECT_LABELS = 4;

  function truncate(text, length) {
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  }

  /**
   * @param {Object} options
   * @param {Array<number|null>} options.xValues          concurrency levels
   * @param {string} options.xLabel
   * @param {(x: number|null) => string} options.formatX
   * @param {Array<{ name: string, colorSlot: number, values: Array<number|null> }>} options.series
   * @param {(value: number) => string} options.formatValue
   * @param {(value: number) => string} options.formatTick
   * @param {'higher'|'lower'} options.better             orders the tooltip best first
   * @param {string} options.ariaLabel
   */
  function LineChart(options) {
    const { xValues, series } = options;
    const allValues = series.flatMap((line) => line.values).filter((value) => typeof value === 'number');
    const ticks = chartScale.niceTicks(Math.max(0, ...allValues), 4);
    const yMax = ticks[ticks.length - 1];
    const plotBottom = HEIGHT - MARGIN.bottom;
    const y = (value) => plotBottom - (value / yMax) * (plotBottom - MARGIN.top);

    const endLabels = series.length >= 2 && series.length <= MAX_DIRECT_LABELS ? placeEndLabels(series, y) : null;
    const right = endLabels ? RIGHT_WITH_LABELS : RIGHT_PLAIN;
    const plotLeft = MARGIN.left + INNER_PAD;
    const plotRight = WIDTH - right - INNER_PAD;
    const x = (index) => (xValues.length === 1 ? (plotLeft + plotRight) / 2 : plotLeft + (index * (plotRight - plotLeft)) / (xValues.length - 1));

    const grid = ticks.map((tick) => dom.svg('g', null,
      dom.svg('line', { x1: MARGIN.left, x2: WIDTH - right, y1: y(tick), y2: y(tick), className: tick === 0 ? 'line-chart__baseline' : 'line-chart__grid' }),
      dom.svg('text', { x: MARGIN.left - 8, y: y(tick), className: 'line-chart__tick', 'text-anchor': 'end', 'dominant-baseline': 'middle', text: options.formatTick(tick) })));

    const xAxis = xValues.map((value, index) =>
      dom.svg('text', { x: x(index), y: plotBottom + 20, className: 'line-chart__tick', 'text-anchor': 'middle', text: options.formatX(value) }));

    const lines = series.map((line) => dom.svg('g', { style: { '--line-color': dom.seriesColor(line.colorSlot) } },
      dom.svg('path', { d: pathFor(line.values, x, y), className: 'line-chart__line' }),
      line.values.map((value, index) => (typeof value === 'number'
        ? dom.svg('circle', { cx: x(index), cy: y(value), r: 4, className: 'line-chart__dot' })
        : null))));

    const labels = endLabels ? endLabels.map((label) => dom.svg('text', {
      x: x(label.index) + 12, y: label.y, className: 'line-chart__end-label', 'dominant-baseline': 'middle', text: truncate(label.name, 16),
    })) : null;

    const crosshair = dom.svg('line', { y1: MARGIN.top, y2: plotBottom, className: 'line-chart__crosshair', visibility: 'hidden' });
    const hitArea = dom.svg('rect', { x: MARGIN.left, y: MARGIN.top, width: WIDTH - right - MARGIN.left, height: plotBottom - MARGIN.top, className: 'line-chart__hit' });

    const chartSvg = dom.svg('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, className: 'line-chart__svg', role: 'img', 'aria-label': options.ariaLabel },
      grid, xAxis,
      dom.svg('text', { x: (MARGIN.left + WIDTH - right) / 2, y: HEIGHT - 6, className: 'line-chart__axis-title', 'text-anchor': 'middle', text: options.xLabel }),
      crosshair, lines, labels, hitArea);

    const plot = dom.h('div', { className: 'line-chart__plot', tabindex: '0' }, chartSvg);
    const tooltip = chartTooltip.createChartTooltip(plot);
    let activeIndex = null;

    function showIndex(index) {
      activeIndex = index;
      crosshair.setAttribute('x1', x(index));
      crosshair.setAttribute('x2', x(index));
      crosshair.setAttribute('visibility', 'visible');
      const rows = series
        .filter((line) => typeof line.values[index] === 'number')
        .sort((a, b) => (options.better === 'lower' ? a.values[index] - b.values[index] : b.values[index] - a.values[index]))
        .map((line) => ({ name: line.name, color: dom.seriesColor(line.colorSlot), valueText: options.formatValue(line.values[index]) }));
      const svgBox = chartSvg.getBoundingClientRect();
      const offset = svgBox.left - plot.getBoundingClientRect().left;
      tooltip.show(offset + x(index) * (svgBox.width / WIDTH),`${options.xLabel}: ${options.formatX(xValues[index])}`, rows);
    }

    function hide() {
      activeIndex = null;
      crosshair.setAttribute('visibility', 'hidden');
      tooltip.hide();
    }

    function nearestIndex(clientX) {
      const box = chartSvg.getBoundingClientRect();
      const svgX = ((clientX - box.left) / box.width) * WIDTH;
      let best = 0;
      xValues.forEach((_, index) => { if (Math.abs(x(index) - svgX) < Math.abs(x(best) - svgX)) best = index; });
      return best;
    }

    hitArea.addEventListener('pointermove', (event) => showIndex(nearestIndex(event.clientX)));
    hitArea.addEventListener('pointerleave', hide);
    plot.addEventListener('focus', () => showIndex(activeIndex === null ? xValues.length - 1 : activeIndex));
    plot.addEventListener('blur', hide);
    plot.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -1 : 1;
      showIndex(Math.min(xValues.length - 1, Math.max(0, (activeIndex === null ? 0 : activeIndex) + step)));
    });

    return dom.h('figure', { className: 'line-chart' },
      series.length >= 2 ? Legend(series) : null,
      plot);
  }

  function pathFor(values, x, y) {
    let path = '';
    let drawing = false;
    values.forEach((value, index) => {
      if (typeof value !== 'number') { drawing = false; return; }
      path += `${drawing ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)} `;
      drawing = true;
    });
    return path.trim();
  }

  /** End labels for each line, or null when two would collide (the legend then carries identity). */
  function placeEndLabels(series, y) {
    const labels = series.map((line) => {
      let index = line.values.length - 1;
      while (index >= 0 && typeof line.values[index] !== 'number') index -= 1;
      return index < 0 ? null : { name: line.name, index, y: y(line.values[index]) };
    });
    if (labels.some((label) => label === null)) return null;
    const sorted = labels.map((label) => label.y).sort((a, b) => a - b);
    const collides = sorted.some((value, index) => index > 0 && value - sorted[index - 1] < MIN_LABEL_GAP);
    return collides ? null : labels;
  }

  function Legend(series) {
    return dom.h('figcaption', { className: 'chart-legend' }, series.map((line) =>
      dom.h('span', { className: 'chart-legend__item' },
        dom.h('span', { className: 'chart-legend__key', style: { background: dom.seriesColor(line.colorSlot) } }),
        line.name)));
  }

  return { LineChart };
});
