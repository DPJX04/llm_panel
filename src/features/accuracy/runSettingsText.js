/* A short line describing how a report's run asked its questions, e.g. "temp 0.7 · 2048 tok · ×3 · 4 at once · system prompt". */
BenchPanel.define('features/accuracy/runSettingsText', ['utils/numberFormat'], (numberFormat) => {
  'use strict';

  /** @param {import('../../types/evalReport').RunSettings} settings */
  function runSettingsText(settings) {
    const parts = [];
    if (settings.temperature !== null) parts.push(`temp ${numberFormat.formatNumber(settings.temperature, settings.temperature % 1 === 0 ? 0 : 2)}`);
    if (settings.maxTokens !== null) parts.push(`${numberFormat.formatNumber(settings.maxTokens, 0)} tok`);
    if (settings.repeats > 1) parts.push(`×${settings.repeats}`);
    if (settings.concurrency > 1) parts.push(`${settings.concurrency} at once`);
    if (settings.systemPrompt) parts.push('system prompt');
    return parts.join(' · ');
  }

  return { runSettingsText };
});
