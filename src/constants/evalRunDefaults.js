/*
 * How an accuracy run asks its questions, and the range each setting may take.
 * Temperature 0 keeps runs repeatable; the token limit leaves a reasoning model room to think before it answers.
 * Questions go one at a time by default, so the timings show what a single user sees.
 */
BenchPanel.define('constants/evalRunDefaults', [], () => {
  'use strict';

  return Object.freeze({
    DEFAULTS: Object.freeze({ temperature: 0, maxTokens: 2048, repeats: 1, concurrency: 1, timeoutS: 300, limit: null, systemPrompt: '' }),
    LIMITS: Object.freeze({
      temperature: { min: 0, max: 2, label: 'Temperature' },
      maxTokens: { min: 16, max: 262144, label: 'Max tokens', whole: true },
      repeats: { min: 1, max: 20, label: 'Repeats', whole: true },
      concurrency: { min: 1, max: 64, label: 'Parallel requests', whole: true },
      timeoutS: { min: 10, max: 3600, label: 'Timeout', whole: true },
      limit: { min: 1, max: 100000, label: 'First N questions', whole: true },
    }),
    MAX_SYSTEM_PROMPT_LENGTH: 20000,
  });
});
