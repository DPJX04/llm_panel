/*
 * The validation gate for question sets: the built-in one and any JSON file a user loads.
 * Fills defaults so the rest of the panel can rely on every field being present.
 */
BenchPanel.define('services/questionSetParser', [
  'types/result', 'types/questionSet', 'utils/errorMessage', 'utils/answerExtraction',
], (result, questionSet, errorMessage, answerExtraction) => {
  'use strict';

  const MAX_QUESTIONS = 5000;
  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

  function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  function text(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  /** Each fact is a string or a list of alternative spellings. @returns {string[][]|null} null when malformed */
  function facts(value) {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) return null;
    const parsed = value.map((fact) => (Array.isArray(fact) ? fact : [fact])
      .filter((spelling) => typeof spelling === 'string' || typeof spelling === 'number')
      .map((spelling) => String(spelling).trim())
      .filter((spelling) => spelling !== ''));
    return parsed.some((fact) => fact.length === 0) ? null : parsed;
  }

  function choiceFields(raw) {
    if (!Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > questionSet.CHOICE_LETTERS.length
      || raw.choices.some((choice) => text(String(choice ?? '')) === '')) {
      return result.fail(`needs 2 to ${questionSet.CHOICE_LETTERS.length} non-empty choices`);
    }
    const letters = questionSet.CHOICE_LETTERS.slice(0, raw.choices.length);
    const reference = text(raw.reference).toUpperCase();
    if (!letters.includes(reference)) return result.fail(`reference must be one of the letters ${letters.join(', ')}`);
    return result.ok({ choices: raw.choices.map((choice) => String(choice).trim()), reference });
  }

  function numberFields(raw) {
    const reference = answerExtraction.toNumber(typeof raw.reference === 'number' ? raw.reference : text(raw.reference));
    if (reference === null) return result.fail('reference must be a number');
    return result.ok({ choices: [], reference: String(reference) });
  }

  function shortFields(raw) {
    const answerable = raw.answerable !== false;
    const keyFacts = facts(raw.keyFacts);
    const declineFacts = facts(raw.declineFacts);
    if (keyFacts === null || declineFacts === null) return result.fail('keyFacts and declineFacts must be lists of text or lists of spellings');
    const reference = text(raw.reference);
    if (answerable && reference === '' && keyFacts.length === 0) return result.fail('needs a reference or keyFacts');
    return result.ok({ choices: [], reference, keyFacts, answerable, declineFacts });
  }

  function passage(raw) {
    return typeof raw.text === 'string' ? raw.text.trim() : '';
  }

  function labelFields(raw) {
    const labels = Array.isArray(raw.labels) ? raw.labels.map((label) => text(String(label ?? ''))) : [];
    if (labels.length < 2 || labels.length > questionSet.MAX_LABELS || labels.includes('')) {
      return result.fail(`needs 2 to ${questionSet.MAX_LABELS} non-empty labels`);
    }
    const lower = labels.map((label) => label.toLowerCase());
    if (new Set(lower).size !== labels.length) return result.fail('labels must be different from each other');
    const index = lower.indexOf(text(raw.reference).toLowerCase());
    if (index === -1) return result.fail(`reference must be one of the labels: ${labels.join(', ')}`);
    if (passage(raw) === '') return result.fail('needs the text to classify');
    return result.ok({ text: passage(raw), choices: labels, reference: labels[index] });
  }

  function summaryFields(raw) {
    const keyFacts = facts(raw.keyFacts);
    const forbiddenFacts = facts(raw.forbiddenFacts);
    if (keyFacts === null || forbiddenFacts === null) return result.fail('keyFacts and forbiddenFacts must be lists of text or lists of spellings');
    if (keyFacts.length === 0) return result.fail('needs keyFacts: the facts a good summary must mention');
    if (passage(raw) === '') return result.fail('needs the text to summarise');
    const maxWords = raw.maxWords === undefined || raw.maxWords === null ? null : raw.maxWords;
    if (maxWords !== null && !(Number.isInteger(maxWords) && maxWords >= 5)) return result.fail('maxWords must be a whole number of at least 5');
    return result.ok({ text: passage(raw), choices: [], reference: text(raw.reference), keyFacts, forbiddenFacts, maxWords });
  }

  const KIND_FIELDS = { choice: choiceFields, number: numberFields, short: shortFields, label: labelFields, summary: summaryFields };

  /** @returns {import('../types/result').Result<import('../types/questionSet').Question>} */
  function toQuestion(raw) {
    if (!isPlainObject(raw)) return result.fail('is not an object');
    const id = text(String(raw.id ?? ''));
    if (id === '') return result.fail('needs an id');
    if (!questionSet.QUESTION_KINDS.includes(raw.kind)) return result.fail(`${id}: kind must be ${questionSet.QUESTION_KINDS.join(', ')}`);
    const question = text(raw.question);
    if (question === '') return result.fail(`${id}: question text is empty`);
    const fields = KIND_FIELDS[raw.kind](raw);
    if (!fields.ok) return result.fail(`${id}: ${fields.error}`);
    return result.ok({
      id,
      kind: raw.kind,
      category: text(raw.category) || 'general',
      question,
      text: '',
      keyFacts: [],
      forbiddenFacts: [],
      maxWords: null,
      answerable: true,
      declineFacts: [],
      ...fields.data,
    });
  }

  /** @returns {import('../types/result').Result<import('../types/questionSet').QuestionSet>} */
  function parseQuestionSet(value) {
    if (!isPlainObject(value) || !Array.isArray(value.questions)) return result.fail('Not a question set (expected an object with a "questions" list)');
    if (value.kind !== undefined && value.kind !== questionSet.QUESTION_SET_KIND) return result.fail(`Not a question set (kind is "${value.kind}")`);
    const id = text(value.id);
    if (id === '') return result.fail('The question set needs an "id"');
    if (value.questions.length === 0) return result.fail('The question set has no questions');
    if (value.questions.length > MAX_QUESTIONS) return result.fail(`The question set has more than ${MAX_QUESTIONS} questions`);

    const questions = [];
    const seen = new Set();
    for (let index = 0; index < value.questions.length; index += 1) {
      const parsed = toQuestion(value.questions[index]);
      if (!parsed.ok) return result.fail(`Question ${index + 1}: ${parsed.error}`);
      if (seen.has(parsed.data.id)) return result.fail(`Question ${index + 1}: the id "${parsed.data.id}" is used twice`);
      seen.add(parsed.data.id);
      questions.push(parsed.data);
    }
    return result.ok({ id, title: text(value.title) || id, description: text(value.description), questions });
  }

  /** @returns {import('../types/result').Result<import('../types/questionSet').QuestionSet>} */
  function parseQuestionSetText(rawText, fileName) {
    let value;
    try {
      value = JSON.parse(String(rawText).replace(BYTE_ORDER_MARK, ''));
    } catch (cause) {
      return result.fail(`${fileName}: ${errorMessage.toErrorMessage(cause)}`);
    }
    const parsed = parseQuestionSet(value);
    return parsed.ok ? parsed : result.fail(`${fileName}: ${parsed.error}`);
  }

  return { parseQuestionSet, parseQuestionSetText };
});
