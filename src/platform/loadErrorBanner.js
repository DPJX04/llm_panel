/* Shows any script error on the page itself, so a broken load never looks like an empty panel. */
(function () {
  'use strict';

  function showError(message) {
    const banner = document.createElement('div');
    banner.setAttribute('role', 'alert');
    banner.style.cssText =
      'margin:16px;padding:12px 16px;border-radius:8px;background:#fdecec;color:#7a1414;' +
      'font:14px system-ui,sans-serif;white-space:pre-wrap;border:1px solid #d03b3b';
    banner.textContent = `Benchmark Panel failed to load:\n${message}`;
    (document.body || document.documentElement).prepend(banner);
  }

  window.addEventListener('error', (event) => {
    if (event.error || event.message) showError(event.error ? event.error.message : event.message);
    else if (event.target && event.target.src) showError(`Could not load ${event.target.src}`);
  }, true);
})();
