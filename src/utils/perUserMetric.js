/* Connects the chosen Per user tok/s formula (A or B) to its metric, and explains when option A had to use option B. */
BenchPanel.define('utils/perUserMetric', ['constants/metricCatalog', 'utils/metricValues'], (metricCatalog, metricValues) => {
  'use strict';

  /** The metric key that shows Per user tok/s in the given formula; option A's when the formula is unknown. */
  function metricKeyFor(formula) {
    const chosen = metricCatalog.PER_USER_FORMULAS.find((option) => option.value === formula) || metricCatalog.PER_USER_FORMULAS[0];
    return chosen.metricKey;
  }

  /**
   * A note to show with a value, or null. Set when option A was asked for but the run has no max_concurrency,
   * so the value was worked out with option B.
   */
  function valueNote(run, metricKey) {
    return metricKey === metricKeyFor('A') && metricValues.perUserFallsBackToE2e(run) ? metricCatalog.PER_USER_FALLBACK_NOTE : null;
  }

  return { metricKeyFor, valueNote };
});
