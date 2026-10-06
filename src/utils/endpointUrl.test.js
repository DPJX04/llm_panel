(function () {
  'use strict';

  const endpointUrl = BenchPanel.require('utils/endpointUrl');

  test('endpoint url: pasted forms become the /v1 base URL', () => {
    assert.equal(endpointUrl.normalizeBaseUrl('localhost:8003'), 'http://localhost:8003/v1');
    assert.equal(endpointUrl.normalizeBaseUrl(' http://10.0.0.5:8003/v1/ '), 'http://10.0.0.5:8003/v1');
    assert.equal(endpointUrl.normalizeBaseUrl('http://host:8003/v1/chat/completions'), 'http://host:8003/v1');
    assert.equal(endpointUrl.normalizeBaseUrl('https://gateway.example/api/v1/models'), 'https://gateway.example/api/v1');
  });

  test('endpoint url: empty or non-http input is rejected', () => {
    assert.equal(endpointUrl.normalizeBaseUrl(''), null);
    assert.equal(endpointUrl.normalizeBaseUrl('ftp://host/v1'), null);
    assert.equal(endpointUrl.normalizeBaseUrl('http://'), null);
  });
})();
