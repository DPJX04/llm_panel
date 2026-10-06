/*
 * The numbers an accuracy run produces, in the same shape as constants/metricCatalog so they format alike.
 * Rates are 0..1 and shown as percentages. `better` is left out where neither direction is better.
 */
BenchPanel.define('constants/qualityMetricCatalog', ['constants/metricCatalog'], (metricCatalog) => {
  'use strict';

  const { HIGHER, LOWER } = metricCatalog;

  const QUALITY_METRICS = Object.freeze({
    accuracy: { label: 'Accuracy', title: 'Accuracy', better: HIGHER, format: 'percent', decimals: 0, exact: true,
      description: 'Questions answered correctly, out of all questions that got a reply.' },
    accuracyGivenAttempted: { label: 'Acc. if answered', title: 'Accuracy when the model answered', better: HIGHER, format: 'percent', decimals: 0, exact: true,
      description: 'Correct answers out of the questions the model chose to answer. High here but low overall means a cautious model.' },
    incorrectRate: { label: 'Wrong', title: 'Wrong answers', better: LOWER, format: 'percent', decimals: 0, exact: true,
      description: 'Questions the model answered and got wrong. A confident wrong answer is the costly kind.' },
    notAttemptedRate: { label: 'Declined', title: 'Declined to answer', format: 'percent', decimals: 0,
      description: 'Questions the model declined. Right for a false premise, a missed answer otherwise.' },
    formatErrorRate: { label: 'Format misses', title: 'Answer format not followed', better: LOWER, format: 'percent', decimals: 0, exact: true,
      description: 'Replies that did not end with "Answer: ..." as asked, or summaries over their word limit.' },
    keyFactCoverage: { label: 'Summary facts', title: 'Key facts covered by summaries', better: HIGHER, format: 'percent', decimals: 0, exact: true,
      description: 'Share of the required facts the summaries mention, averaged over summary questions. Partial credit, unlike accuracy.' },
    rougeL: { label: 'ROUGE-L', title: 'ROUGE-L of summaries', better: HIGHER, format: 'fixed', decimals: 2,
      description: 'Word overlap with the reference summary, 0 to 1. Rewards wording close to the reference; read it beside summary facts.' },
    meanTtftMs: { label: 'Mean TTFT', title: 'Mean time to first token', better: LOWER, format: 'ms', decimals: 0,
      description: 'Wait before the first token, reasoning or answer, with one question at a time.' },
    meanTotalMs: { label: 'Time / question', title: 'Mean time per question', better: LOWER, format: 'seconds', decimals: 1,
      description: 'From sending the question to the last token. Includes any reasoning before the answer.' },
    p95TotalMs: { label: 'P95 time', title: 'P95 time per question', better: LOWER, format: 'seconds', decimals: 1,
      description: '95% of questions were answered within this time.' },
    decodeTokensPerS: { label: 'Decode tok/s', title: 'Generation speed', better: HIGHER, format: 'fixed', decimals: 1, unit: 'tok/s',
      description: 'Output tokens per second after the first token, averaged over questions.' },
    meanOutputTokens: { label: 'Tokens / answer', title: 'Mean output tokens per answer', format: 'fixed', decimals: 0,
      description: 'Longer replies cost more time; reasoning models spend many tokens before answering.' },
  });

  return { QUALITY_METRICS };
});
