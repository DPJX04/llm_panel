/*
 * Splits a server-sent event stream into its data payloads. Network chunks can end mid-line,
 * so the unfinished tail is kept until the next chunk arrives.
 */
BenchPanel.define('utils/sseDecoder', [], () => {
  'use strict';

  function payloadOf(line) {
    if (!line.startsWith('data:')) return null;
    return line.slice(5).replace(/^ /, '');
  }

  function createSseDecoder() {
    let pending = '';

    /** @param {string} text  @returns {string[]} the data payloads completed by this chunk */
    function push(text) {
      const lines = (pending + text).split('\n');
      pending = lines.pop();
      return lines.map((line) => payloadOf(line.replace(/\r$/, ''))).filter((payload) => payload !== null);
    }

    /** The last payload when the stream ends without a closing newline. */
    function flush() {
      const payload = payloadOf(pending.replace(/\r$/, ''));
      pending = '';
      return payload === null ? [] : [payload];
    }

    return { push, flush };
  }

  return { createSseDecoder };
});
