/*
 * The headline numbers of one evaluation report, as SimpleQA reports them: accuracy, accuracy when the model
 * answered, wrong and declined rates; plus format misses and the speed of each answer.
 * Errors (no reply) are left out of every rate and counted on their own.
 */
BenchPanel.define('utils/evalSummary', ['utils/sampleStats'], (sampleStats) => {
  'use strict';

  function share(count, total) {
    return total > 0 ? count / total : null;
  }

  /** Output tokens per second after the first token; null when too short to measure. */
  function decodeSpeed(evalCase) {
    const { outputTokens, totalMs, ttftMs } = evalCase;
    if (typeof outputTokens !== 'number' || outputTokens < 2 || typeof totalMs !== 'number' || typeof ttftMs !== 'number') return null;
    const seconds = (totalMs - ttftMs) / 1000;
    return seconds > 0 ? (outputTokens - 1) / seconds : null;
  }

  function countOutcomes(cases) {
    const counts = { correct: 0, incorrect: 0, 'not-attempted': 0, error: 0 };
    cases.forEach((evalCase) => { counts[evalCase.outcome] += 1; });
    return counts;
  }

  function accuracyOf(cases) {
    const counts = countOutcomes(cases);
    return share(counts.correct, cases.length - counts.error);
  }

  /** @returns {Array<{ category: string, cases: number, accuracy: number|null }>} in first-seen order */
  function byCategory(cases) {
    const groups = new Map();
    cases.forEach((evalCase) => {
      if (!groups.has(evalCase.category)) groups.set(evalCase.category, []);
      groups.get(evalCase.category).push(evalCase);
    });
    return Array.from(groups, ([category, group]) => ({ category, cases: group.length, accuracy: accuracyOf(group) }));
  }

  /**
   * With repeats, the lowest and highest accuracy of any single pass through the questions: how much of a gap
   * between models could be luck. Null for a run that asked each question once.
   */
  function accuracyRange(cases) {
    const attempts = Array.from(new Set(cases.map((evalCase) => evalCase.attempt || 1)));
    if (attempts.length < 2) return null;
    const perAttempt = attempts
      .map((attempt) => accuracyOf(cases.filter((evalCase) => (evalCase.attempt || 1) === attempt)))
      .filter((value) => value !== null);
    return perAttempt.length > 1 ? { min: Math.min(...perAttempt), max: Math.max(...perAttempt) } : null;
  }

  /**
   * Rates count every attempt, so with three repeats each question weighs three times.
   * @param {import('../types/evalReport').EvalReport} report
   */
  function summarizeReport(report) {
    const cases = report.cases;
    const counts = countOutcomes(cases);
    const scored = cases.length - counts.error;
    // Short answers have no required format; every other kind does (a final "Answer: ..." line, or a summary's word limit).
    const formatted = cases.filter((evalCase) => evalCase.outcome !== 'error' && evalCase.kind !== 'short');
    const summaries = cases.filter((evalCase) => evalCase.outcome !== 'error' && evalCase.kind === 'summary');
    const answered = cases.filter((evalCase) => evalCase.outcome !== 'error');
    return {
      cases: cases.length,
      questions: new Set(cases.map((evalCase) => evalCase.id)).size,
      repeats: Math.max(1, ...cases.map((evalCase) => evalCase.attempt || 1)),
      accuracyRange: accuracyRange(cases),
      scored,
      errors: counts.error,
      truncated: answered.filter((evalCase) => evalCase.finishReason === 'length').length,
      accuracy: share(counts.correct, scored),
      accuracyGivenAttempted: share(counts.correct, counts.correct + counts.incorrect),
      incorrectRate: share(counts.incorrect, scored),
      notAttemptedRate: share(counts['not-attempted'], scored),
      formatErrorRate: share(formatted.filter((evalCase) => !evalCase.formatFollowed).length, formatted.length),
      meanTtftMs: sampleStats.mean(answered.map((evalCase) => evalCase.ttftMs)),
      meanTotalMs: sampleStats.mean(answered.map((evalCase) => evalCase.totalMs)),
      p95TotalMs: sampleStats.percentile(answered.map((evalCase) => evalCase.totalMs), 0.95),
      decodeTokensPerS: sampleStats.mean(answered.map(decodeSpeed)),
      meanOutputTokens: sampleStats.mean(answered.map((evalCase) => evalCase.outputTokens)),
      keyFactCoverage: sampleStats.mean(summaries.map((evalCase) => evalCase.coverage)),
      rougeL: sampleStats.mean(summaries.map((evalCase) => evalCase.rougeL)),
      categories: byCategory(cases),
    };
  }

  return { summarizeReport, decodeSpeed };
});
