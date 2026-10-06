/*
 * Runs every registered test and writes the outcome into the page and its title (read by scripts/run-tests.sh).
 * A test may return a promise; it is awaited before the next test starts.
 */
(async function () {
  'use strict';

  const results = [];
  for (const entry of window.BenchPanelTests.registered) {
    try {
      await entry.fn();
      results.push({ name: entry.name, passed: true });
    } catch (error) {
      results.push({ name: entry.name, passed: false, message: error.message });
    }
  }
  const loadError = document.querySelector('[role="alert"]');
  if (loadError) results.push({ name: 'app scripts load', passed: false, message: loadError.textContent });

  const failed = results.filter((entry) => !entry.passed);
  const summary = `${failed.length === 0 ? 'PASS' : 'FAIL'} ${results.length - failed.length}/${results.length}`;
  document.title = summary;

  const output = document.getElementById('results');
  output.textContent = [summary, '', ...results.map((entry) =>
    `${entry.passed ? 'ok  ' : 'FAIL'}  ${entry.name}${entry.passed ? '' : `\n      ${entry.message}`}`)].join('\n');
  output.className = failed.length === 0 ? 'pass' : 'fail';
})();
