(function () {
  'use strict';

  const service = BenchPanel.require('services/modelEndpointService');

  /** Swaps window.fetch for one call, so the service can be tested without a server. */
  async function withFetch(fake, body) {
    const real = window.fetch;
    window.fetch = fake;
    try {
      return await body();
    } finally {
      window.fetch = real;
    }
  }

  /** A streamed reply the way vLLM sends it: one SSE event per chunk, usage last, then [DONE]. */
  function streamResponse(events, splitAt) {
    const text = events.map((event) => `data: ${typeof event === 'string' ? event : JSON.stringify(event)}\n\n`).join('');
    const bytes = new TextEncoder().encode(text);
    const cut = splitAt || Math.floor(bytes.length / 2);
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, cut));
        controller.enqueue(bytes.slice(cut));
        controller.close();
      },
    });
    return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
  }

  const request = { baseUrl: 'http://server/v1', apiKey: '', servedName: 'qwen', messages: [{ role: 'user', content: 'Q' }], temperature: 0, maxTokens: 64 };

  test('model endpoint: a streamed reply is joined, timed, and counted', async () => {
    let sent = null;
    const reply = await withFetch(async (url, init) => {
      sent = { url, body: JSON.parse(init.body), headers: init.headers };
      return streamResponse([
        { choices: [{ delta: { role: 'assistant' } }] },
        { choices: [{ delta: { reasoning: 'thinking…' } }] },
        { choices: [{ delta: { content: 'Answer: ' } }] },
        { choices: [{ delta: { content: 'B' }, finish_reason: 'stop' }] },
        { choices: [], usage: { prompt_tokens: 31, completion_tokens: 12 } },
        '[DONE]',
      ]);
    }, () => service.streamChat(request));
    assert.ok(reply.ok, reply.error);
    assert.equal(reply.data.text, 'Answer: B');
    assert.equal(reply.data.inputTokens, 31);
    assert.equal(reply.data.outputTokens, 12);
    assert.equal(reply.data.finishReason, 'stop');
    assert.ok(reply.data.ttftMs !== null && reply.data.ttftMs <= reply.data.totalMs);
    assert.equal(sent.url, 'http://server/v1/chat/completions');
    assert.deepEqual([sent.body.model, sent.body.stream, sent.body.stream_options.include_usage, sent.body.max_tokens], ['qwen', true, true, 64]);
    assert.equal(sent.headers.Authorization, undefined, 'no key, no Authorization header');
  });

  test('model endpoint: a server error and an unreachable server become readable messages', async () => {
    const refused = await withFetch(async () => new Response(JSON.stringify({ message: 'model "x" does not exist' }), { status: 404 }),
      () => service.streamChat(request));
    assert.ok(!refused.ok && refused.error === 'Server replied 404: model "x" does not exist', refused.error);
    const offline = await withFetch(async () => { throw new TypeError('Failed to fetch'); }, () => service.streamChat(request));
    assert.ok(!offline.ok && /Could not reach http:\/\/server\/v1/.test(offline.error), offline.error);
  });

  test('model endpoint: listing models reads the served name and the loaded model', async () => {
    const listed = await withFetch(async (url, init) => {
      assert.equal(url, 'http://server/v1/models');
      assert.equal(init.headers.Authorization, 'Bearer secret');
      return new Response(JSON.stringify({ data: [{ id: 'qwen', root: 'Qwen/Qwen3-4B-Instruct-2507', max_model_len: 32768 }] }), { status: 200 });
    }, () => service.listModels('http://server/v1', 'secret'));
    assert.ok(listed.ok, listed.error);
    assert.deepEqual(listed.data, [{ servedName: 'qwen', root: 'Qwen/Qwen3-4B-Instruct-2507', maxModelLen: 32768 }]);
  });
})();
