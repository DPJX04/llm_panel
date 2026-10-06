/*
 * Cleans a reply before grading: drops the <think> block that a reasoning model leaves in the answer when the
 * server was started without a reasoning parser. With a parser, vLLM sends the reasoning separately.
 */
BenchPanel.define('utils/answerText', [], () => {
  'use strict';

  function stripReasoning(text) {
    const withoutBlocks = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '');
    // Some chat templates open the block inside the prompt, so the reply holds only the closing tag.
    const closing = withoutBlocks.search(/<\/think>/i);
    return (closing === -1 ? withoutBlocks : withoutBlocks.slice(closing + '</think>'.length)).trim();
  }

  return { stripReasoning };
});
