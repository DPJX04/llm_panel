/**
 * The result of asking one model one question set. Saved in the workspace and exportable as a file.
 *
 * Outcomes follow SimpleQA: a scored answer is correct, incorrect (the model answered and was wrong),
 * or not attempted (it declined). "error" means no answer came back (timeout, server error).
 *
 * @typedef {'correct'|'incorrect'|'not-attempted'|'error'} Outcome
 *
 * @typedef {Object} EvalCase
 * @property {string} id
 * @property {number} attempt          which repeat, from 1; a question asked three times has three cases
 * @property {'choice'|'number'|'short'|'label'|'summary'} kind
 * @property {string} category
 * @property {string} question
 * @property {string} text             label and summary: the passage the model was given
 * @property {string[]} choices        choice options, or label names
 * @property {string} reference
 * @property {boolean} answerable
 * @property {number|null} maxWords    summary word limit
 * @property {string} answer           the model's reply, reasoning removed
 * @property {Outcome} outcome
 * @property {string|null} extracted   the letter, number or label read from the reply; null when none was found
 * @property {boolean} formatFollowed  the reply ended with "Answer: ..." as asked; for a summary, it kept to the word limit
 * @property {number|null} coverage    summary: share of the key facts it mentions, 0..1
 * @property {number|null} rougeL      summary: ROUGE-L overlap with the reference summary, 0..1
 * @property {number|null} wordCount   summary: words in the reply
 * @property {string|null} error
 * @property {number|null} totalMs     request sent to last token
 * @property {number|null} ttftMs      request sent to first token (reasoning or answer)
 * @property {number|null} inputTokens
 * @property {number|null} outputTokens
 * @property {string|null} finishReason  "length" means the reply hit the max-tokens limit
 *
 * @typedef {Object} RunSettings
 * @property {number|null} temperature
 * @property {number|null} maxTokens
 * @property {number} repeats            how often each question was asked
 * @property {number} concurrency        questions in flight at once; above 1 the timings reflect load
 * @property {number|null} timeoutS
 * @property {string} systemPrompt       empty when none was sent
 *
 * @typedef {Object} EvalReport
 * @property {string} id                 unique per model, question set and run time
 * @property {string} modelKey           matches the benchmark runs' modelKey, so the views line them up
 * @property {string} modelId
 * @property {string|null} label
 * @property {string} servedName
 * @property {string} baseUrl
 * @property {string} questionSetId      the set's id, plus the subset when only part of the set was asked
 * @property {string} questionSetTitle
 * @property {{ key: string, label: string }|null} subset  which part of the set was asked; null for all of it
 * @property {string} createdAt          ISO time
 * @property {RunSettings} settings
 * @property {EvalCase[]} cases
 * @property {string} sourceFile
 * @property {Object} raw                the report as saved, so a reload re-runs the same validation
 */
BenchPanel.define('types/evalReport', [], () => {
  'use strict';

  const EVAL_REPORT_KIND = 'llm-eval-report';
  const EVAL_REPORT_VERSION = 1;
  const OUTCOMES = Object.freeze(['correct', 'incorrect', 'not-attempted', 'error']);

  return { EVAL_REPORT_KIND, EVAL_REPORT_VERSION, OUTCOMES };
});
