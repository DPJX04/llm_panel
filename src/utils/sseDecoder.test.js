(function () {
  'use strict';

  const sseDecoder = BenchPanel.require('utils/sseDecoder');

  test('sse: payloads split across network chunks are joined', () => {
    const decoder = sseDecoder.createSseDecoder();
    assert.deepEqual(decoder.push('data: {"a":'), []);
    assert.deepEqual(decoder.push('1}\n\ndata: {"b":2}\r\n\n: keep-alive\n'), ['{"a":1}', '{"b":2}']);
    assert.deepEqual(decoder.push('data: [DONE]'), []);
    assert.deepEqual(decoder.flush(), ['[DONE]']);
  });
})();
