/*
 * Turns what a user pastes into the base URL of an OpenAI-compatible server.
 * "localhost:8003", "http://host:8003/v1/" and "http://host:8003/v1/chat/completions" all become "http://host:8003/v1".
 */
BenchPanel.define('utils/endpointUrl', [], () => {
  'use strict';

  const ENDPOINT_SUFFIX = /\/(?:chat\/completions|completions|models)\/?$/;

  /** @returns {string|null} null when the text is not a usable http(s) URL */
  function normalizeBaseUrl(text) {
    const trimmed = String(text || '').trim();
    if (trimmed === '') return null;
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    let url;
    try {
      url = new URL(withScheme);
    } catch (cause) {
      return null;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    let path = url.pathname.replace(ENDPOINT_SUFFIX, '').replace(/\/+$/, '');
    if (path === '') path = '/v1';
    return `${url.origin}${path}`;
  }

  return { normalizeBaseUrl };
});
