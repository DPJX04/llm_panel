/*
 * Checks that runs compared side by side were measured the same way. Models are only compared
 * at the same concurrency level, so each level is checked on its own.
 */
BenchPanel.define('utils/settingsConsistency', ['utils/runCollection', 'utils/ranking'], (runCollection, ranking) => {
  'use strict';

  function perRequest(total, count) {
    return typeof total === 'number' && count > 0 ? total / count : null;
  }

  function text(value) {
    return value === null || value === undefined ? null : String(value);
  }

  const CHECKS = [
    { label: 'Prompts per run', read: (run) => run.numPrompts, show: (value) => String(value), tolerance: 0 },
    { label: 'Output tokens per request', read: (run) => perRequest(run.totalOutputTokens, run.completed),
      show: (value) => value.toFixed(0), tolerance: 0.02,
      note: 'Different output lengths change E2E latency and throughput. Fix it with --sharegpt-output-len or --ignore-eos.' },
    { label: 'Input tokens per request', read: (run) => perRequest(run.totalInputTokens, run.completed),
      show: (value) => value.toFixed(0), tolerance: 0.02,
      note: 'Either different prompts, or tokenizers that count the same prompts differently.' },
    { label: 'Request rate', read: (run) => text(run.raw.request_rate), show: (value) => value },
    { label: 'Endpoint', read: (run) => text(run.raw.endpoint_type || run.raw.backend), show: (value) => value },
  ];

  function sameValue(a, b, tolerance) {
    return typeof a === 'number' && typeof b === 'number' ? ranking.isWithin(a, b, tolerance) : a === b;
  }

  /** Groups the runs of one level by their value for one check. */
  function groupsFor(runs, check, nameFor) {
    const groups = [];
    runs.forEach((run) => {
      const value = check.read(run);
      if (value === null) return;
      let group = groups.find((candidate) => sameValue(candidate.value, value, check.tolerance));
      if (!group) { group = { value, names: [] }; groups.push(group); }
      if (!group.names.includes(nameFor(run.modelKey))) group.names.push(nameFor(run.modelKey));
    });
    return groups;
  }

  /**
   * @param {Object[]} runs
   * @param {(modelKey: string) => string} nameFor  display name of a model
   * @returns {Array<{ label: string, level: number|null, detail: string, note?: string }>}  empty when consistent
   */
  function findSettingDifferences(runs, nameFor) {
    const differences = [];
    runCollection.concurrencyLevels(runs).forEach((level) => {
      const levelRuns = runs.filter((run) => run.concurrency === level);
      CHECKS.forEach((check) => {
        const groups = groupsFor(levelRuns, check, nameFor);
        if (groups.length < 2) return;
        differences.push({
          label: check.label,
          level,
          detail: groups.map((group) => `${check.show(group.value)} (${group.names.join(', ')})`).join(' vs '),
          note: check.note,
        });
      });
    });
    return differences;
  }

  return { findSettingDifferences };
});
