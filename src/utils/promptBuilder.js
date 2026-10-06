/*
 * The message sent for each question: zero-shot with a fixed answer format, as simple-evals asks chat models.
 * Only the question, its options and its passage go in; the reference answer, key facts and forbidden facts never do.
 */
BenchPanel.define('utils/promptBuilder', ['types/questionSet'], (questionSet) => {
  'use strict';

  function choicePrompt(question) {
    const letters = questionSet.CHOICE_LETTERS.slice(0, question.choices.length);
    const options = question.choices.map((text, index) => `${letters[index]}) ${text}`).join('\n');
    return 'Answer the following multiple choice question. Think step by step, then end your reply with a final line '
      + `of the form "Answer: LETTER", where LETTER is one of ${letters.join(', ')}.\n\n${question.question}\n\n${options}`;
  }

  function numberPrompt(question) {
    return 'Solve the following problem. Think step by step, then end your reply with a final line of the form '
      + `"Answer: NUMBER", giving only the number, without units.\n\n${question.question}`;
  }

  function shortPrompt(question) {
    return 'Answer the following question briefly, in one or two sentences. If you do not know the answer, or the '
      + `question cannot be answered, say so instead of guessing.\n\nQuestion: ${question.question}`;
  }

  function quoted(text) {
    return `"""\n${text}\n"""`;
  }

  function labelPrompt(question) {
    return `${question.question} Choose exactly one of these labels: ${question.choices.join(', ')}. You may think briefly, then end `
      + `your reply with a final line of the form "Answer: LABEL", using the label exactly as written.\n\nText:\n${quoted(question.text)}`;
  }

  function summaryPrompt(question) {
    const limit = question.maxWords ? ` Use at most ${question.maxWords} words.` : '';
    return `${question.question}${limit} Reply with the summary only, and include only facts stated in the text.\n\nText:\n${quoted(question.text)}`;
  }

  const BUILDERS = { choice: choicePrompt, number: numberPrompt, short: shortPrompt, label: labelPrompt, summary: summaryPrompt };

  /**
   * @param {import('../types/questionSet').Question} question
   * @param {string} [systemPrompt]  sent first when given, e.g. the prompt the model runs with in production
   * @returns {Array<{ role: string, content: string }>}
   */
  function buildMessages(question, systemPrompt) {
    const user = { role: 'user', content: BUILDERS[question.kind](question) };
    return systemPrompt ? [{ role: 'system', content: systemPrompt }, user] : [user];
  }

  return { buildMessages };
});
