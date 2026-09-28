/*
 * When two results count as the same. Each configuration is benchmarked once and vLLM runs
 * typically vary by 1-3%, so smaller gaps are shown as ties instead of as a win.
 */
BenchPanel.define('constants/rankingRules', [], () => {
  'use strict';

  return {
    TIE_TOLERANCE: 0.03,
    TIE_TOLERANCE_LABEL: '3%',
  };
});
