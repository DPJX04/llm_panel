/* Picks round axis ticks (0, 50, 100 …) that cover a value range. */
BenchPanel.define('utils/chartScale', [], () => {
  'use strict';

  function niceStep(rawStep) {
    const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const fraction = rawStep / power;
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
    return nice * power;
  }

  /**
   * Ticks from zero up to at least `max`.
   * @returns {number[]}
   */
  function niceTicks(max, targetCount) {
    if (!(max > 0)) return [0, 1];
    const step = niceStep(max / Math.max(1, targetCount));
    const ticks = [];
    for (let value = 0; value < max + step * 0.5; value += step) ticks.push(Number(value.toPrecision(12)));
    if (ticks[ticks.length - 1] < max) ticks.push(Number((ticks[ticks.length - 1] + step).toPrecision(12)));
    return ticks;
  }

  return { niceTicks };
});
