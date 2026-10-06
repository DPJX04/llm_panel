/* Reads a question set file the user picked, through the question set validation gate. */
BenchPanel.define('services/questionSetFileService', [
  'types/result', 'utils/errorMessage', 'services/questionSetParser',
], (result, errorMessage, questionSetParser) => {
  'use strict';

  /** @param {File} file  @returns {Promise<import('../types/result').Result<import('../types/questionSet').QuestionSet>>} */
  async function readQuestionSetFile(file) {
    try {
      return questionSetParser.parseQuestionSetText(await file.text(), file.name);
    } catch (cause) {
      return result.fail(`${file.name}: ${errorMessage.toErrorMessage(cause)}`);
    }
  }

  return { readQuestionSetFile };
});
