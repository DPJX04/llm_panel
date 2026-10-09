/*
 * Which formula "Per user tok/s" uses everywhere: option A (the default) or option B. Remembered in this browser;
 * every view that shows the metric subscribes and redraws when it changes.
 */
BenchPanel.define('store/perUserFormulaStore', ['services/preferencesService'], (preferencesService) => {
  'use strict';

  const PREFERENCE = 'metrics.perUserFormula';
  const FORMULAS = Object.freeze(['A', 'B']);
  const DEFAULT_FORMULA = 'A';

  /** The saved formula, or the default when none was saved or the saved one is unknown. */
  function savedFormula() {
    const saved = preferencesService.load(PREFERENCE, DEFAULT_FORMULA);
    return FORMULAS.includes(saved) ? saved : DEFAULT_FORMULA;
  }

  let formula = savedFormula();
  const listeners = new Set();

  /** @returns {'A'|'B'} */
  function getFormula() {
    return formula;
  }

  /** Switches the formula for every view and remembers it. An unknown value is ignored. */
  function setFormula(next) {
    if (!FORMULAS.includes(next) || next === formula) return;
    formula = next;
    preferencesService.save(PREFERENCE, next);
    listeners.forEach((listener) => listener(formula));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getFormula, setFormula, subscribe };
});
