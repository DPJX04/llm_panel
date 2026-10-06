/* Puts text in one comparable form: lower case, letters and digits only, single spaces. */
BenchPanel.define('utils/textNormalize', [], () => {
  'use strict';

  /** "TensorRT-LLM, I2_S!" -> "tensorrt llm i2 s" */
  function normalizeText(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  return { normalizeText };
});
