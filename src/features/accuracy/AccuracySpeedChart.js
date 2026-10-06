/* Accuracy against time per question, one dot per model: the best models sit top left. */
BenchPanel.define('features/accuracy/AccuracySpeedChart', [
  'components/ScatterChart/ScatterChart', 'utils/numberFormat',
], (scatterChart, numberFormat) => {
  'use strict';

  const RATE_TICKS = [0, 0.25, 0.5, 0.75, 1];

  /** @param {{ rows: Object[] }} props  rows from resultRows */
  function AccuracySpeedChart(props) {
    return scatterChart.ScatterChart({
      points: props.rows.map((row) => ({
        name: row.model.name,
        colorSlot: row.model.colorSlot,
        x: row.summary.meanTotalMs === null ? null : row.summary.meanTotalMs / 1000,
        y: row.summary.accuracy,
      })),
      xLabel: 'Mean time per question (s)',
      yLabel: 'Accuracy',
      yTicks: RATE_TICKS,
      formatX: (value) => `${numberFormat.formatNumber(value, 1)} s`,
      formatY: (value) => numberFormat.formatWithUnit(value * 100, 0, '%'),
      formatTickX: (value) => `${numberFormat.formatNumber(value, Number.isInteger(value) ? 0 : 1)} s`,
      formatTickY: (value) => `${Math.round(value * 100)}%`,
      ariaLabel: 'Accuracy against mean time per question, one dot per model',
    });
  }

  return { AccuracySpeedChart };
});
