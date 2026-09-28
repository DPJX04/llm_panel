/* Hands the user a file to save, such as an exported workspace or a CSV. */
BenchPanel.define('services/fileDownloadService', ['types/result', 'utils/errorMessage'], (result, errorMessage) => {
  'use strict';

  const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

  /** @returns {import('../types/result').Result<true>} */
  function downloadText(fileName, text, mimeType) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return result.ok(true);
    } catch (cause) {
      return result.fail(`Download failed: ${errorMessage.toErrorMessage(cause)}`);
    }
  }

  function downloadJson(fileName, value) {
    return downloadText(fileName, JSON.stringify(value, null, 2), 'application/json');
  }

  function downloadCsv(fileName, csvText) {
    // The byte-order mark makes Excel open the file as UTF-8.
    return downloadText(fileName, BYTE_ORDER_MARK + csvText, 'text/csv;charset=utf-8');
  }

  return { downloadJson, downloadCsv };
});
