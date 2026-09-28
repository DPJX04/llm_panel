/* Plain-language meaning of each concurrency level, shown above the ranking tables. */
BenchPanel.define('constants/concurrencyNotes', [], () => {
  'use strict';

  const NOTES = Object.freeze({
    1: 'One active request. Best-case speed for a single user.',
    2: 'Light use, a couple of people at once.',
    4: 'A small internal chatbot deployment.',
    8: 'A medium multi-user workload.',
    16: 'High load. The key level for checking capacity.',
    32: 'Heavy load. Shows where the server starts to saturate.',
    64: 'Stress test. Shows the ceiling of the hardware.',
  });

  const UNCAPPED_NOTE = 'No concurrency cap. All requests were sent at once.';

  /** @param {number|null} concurrency */
  function noteFor(concurrency) {
    if (concurrency === null) return UNCAPPED_NOTE;
    return NOTES[concurrency] || `${concurrency} requests in flight at the same time.`;
  }

  return { noteFor };
});
