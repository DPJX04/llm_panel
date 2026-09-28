/* The one place that turns a raw error of any kind into a clean message. */
BenchPanel.define('utils/errorMessage', [], () => {
  'use strict';

  function toErrorMessage(cause) {
    if (cause instanceof SyntaxError) return `Not valid JSON (${cause.message})`;
    if (cause instanceof Error) return cause.message;
    if (typeof cause === 'string') return cause;
    return 'Unknown error';
  }

  return { toErrorMessage };
});
