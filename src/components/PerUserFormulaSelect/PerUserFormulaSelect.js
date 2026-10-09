/* The picker for the formula "Per user tok/s" uses (option A or B). Switching it changes the metric in every tab at once. */
BenchPanel.define('components/PerUserFormulaSelect/PerUserFormulaSelect', [
  'components/SelectField/SelectField', 'store/perUserFormulaStore', 'constants/metricCatalog',
], (selectField, perUserFormulaStore, metricCatalog) => {
  'use strict';

  function PerUserFormulaSelect() {
    return selectField.SelectField({
      label: 'Per user tok/s',
      value: perUserFormulaStore.getFormula(),
      options: metricCatalog.PER_USER_FORMULAS.map((option) => ({ value: option.value, label: option.label })),
      onChange: perUserFormulaStore.setFormula,
    });
  }

  return { PerUserFormulaSelect };
});
