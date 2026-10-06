/*
 * Checks the settings a user typed for an accuracy run and turns them into numbers.
 * Every problem is reported at once, so the user can fix them all in one go.
 */
BenchPanel.define('utils/runSettings', ['types/result', 'constants/evalRunDefaults'], (result, evalRunDefaults) => {
  'use strict';

  const { LIMITS, MAX_SYSTEM_PROMPT_LENGTH } = evalRunDefaults;

  function readNumber(raw, key, problems) {
    const limit = LIMITS[key];
    const text = String(raw === null || raw === undefined ? '' : raw).trim();
    const value = Number(text);
    if (text === '' || !Number.isFinite(value) || (limit.whole && !Number.isInteger(value)) || value < limit.min || value > limit.max) {
      problems.push(`${limit.label} must be ${limit.whole ? 'a whole number' : 'a number'} from ${limit.min} to ${limit.max}`);
      return null;
    }
    return value;
  }

  /**
   * @param {{ temperature: any, maxTokens: any, repeats: any, concurrency: any, timeoutS: any, limit: any, systemPrompt: any }} raw
   *   limit may be empty, meaning every question
   * @returns {import('../types/result').Result<{ temperature: number, maxTokens: number, repeats: number, concurrency: number,
   *   timeoutS: number, limit: number|null, systemPrompt: string }>}
   */
  function validateRunSettings(raw) {
    const problems = [];
    const limitText = String(raw.limit === null || raw.limit === undefined ? '' : raw.limit).trim();
    const settings = {
      temperature: readNumber(raw.temperature, 'temperature', problems),
      maxTokens: readNumber(raw.maxTokens, 'maxTokens', problems),
      repeats: readNumber(raw.repeats, 'repeats', problems),
      concurrency: readNumber(raw.concurrency, 'concurrency', problems),
      timeoutS: readNumber(raw.timeoutS, 'timeoutS', problems),
      limit: limitText === '' ? null : readNumber(limitText, 'limit', problems),
      systemPrompt: String(raw.systemPrompt || '').trim(),
    };
    if (settings.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) problems.push(`The system prompt must be under ${MAX_SYSTEM_PROMPT_LENGTH} characters`);
    return problems.length > 0 ? result.fail(problems.join('\n')) : result.ok(settings);
  }

  return { validateRunSettings };
});
