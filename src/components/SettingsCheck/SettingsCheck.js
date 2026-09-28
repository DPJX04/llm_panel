/* Warns when the runs being compared were not measured the same way. Shows nothing when they were. */
BenchPanel.define('components/SettingsCheck/SettingsCheck', [
  'components/Callout/Callout', 'utils/settingsConsistency', 'utils/numberFormat',
], (callout, settingsConsistency, numberFormat) => {
  'use strict';

  const MAX_LINES = 6;

  /** @param {{ runs: Object[], models: Object[] }} props */
  function SettingsCheck(props) {
    const names = new Map(props.models.map((model) => [model.key, model.name]));
    const differences = settingsConsistency.findSettingDifferences(props.runs, (key) => names.get(key) || key);
    if (differences.length === 0) return null;

    const lines = differences.slice(0, MAX_LINES)
      .map((difference) => `${difference.label} at concurrency ${numberFormat.formatConcurrency(difference.level)}: ${difference.detail}`);
    if (differences.length > MAX_LINES) lines.push(`…and ${differences.length - MAX_LINES} more`);
    const notes = Array.from(new Set(differences.map((difference) => difference.note).filter(Boolean)));

    return callout.Callout({
      tone: 'warning',
      title: 'Some runs were not measured the same way, so those comparisons are not like for like.',
      lines,
      note: notes.join(' '),
    });
  }

  return { SettingsCheck };
});
