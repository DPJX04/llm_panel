/*
 * The question sets on offer for a run: the built-in starter set, plus any loaded from files in this session.
 * A loaded set with the same id as an earlier one replaces it.
 */
BenchPanel.define('features/accuracy/questionSetLibrary', [
  'constants/starterQuestionSet', 'services/questionSetParser', 'services/questionSetFileService',
], (starterQuestionSet, questionSetParser, questionSetFileService) => {
  'use strict';

  function createQuestionSetLibrary() {
    const builtIn = questionSetParser.parseQuestionSet(starterQuestionSet.STARTER_QUESTION_SET);
    if (!builtIn.ok) throw new Error(`The built-in question set is invalid: ${builtIn.error}`);
    let sets = [builtIn.data];

    function list() {
      return sets;
    }

    function find(id) {
      return sets.find((set) => set.id === id) || null;
    }

    /** @returns {Promise<import('../../types/result').Result<import('../../types/questionSet').QuestionSet>>} */
    async function load(file) {
      const read = await questionSetFileService.readQuestionSetFile(file);
      if (read.ok) sets = sets.filter((set) => set.id !== read.data.id).concat(read.data);
      return read;
    }

    return { list, find, load };
  }

  return { createQuestionSetLibrary };
});
