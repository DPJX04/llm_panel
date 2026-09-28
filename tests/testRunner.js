/*
 * A minimal test runner that works in any browser with no install.
 * Test files call test(name, fn) and use assert.*; tests/runTests.js runs them and prints the result.
 */
(function () {
  'use strict';

  const registered = [];

  function fail(message) {
    throw new Error(message);
  }

  function show(value) {
    return JSON.stringify(value);
  }

  window.test = (name, fn) => registered.push({ name, fn });

  window.assert = Object.freeze({
    equal(actual, expected, label) {
      if (actual !== expected) fail(`${label || 'equal'}: expected ${show(expected)}, got ${show(actual)}`);
    },
    near(actual, expected, tolerance, label) {
      if (typeof actual !== 'number' || Math.abs(actual - expected) > (tolerance || 1e-9)) {
        fail(`${label || 'near'}: expected ≈${expected}, got ${show(actual)}`);
      }
    },
    deepEqual(actual, expected, label) {
      if (show(actual) !== show(expected)) fail(`${label || 'deepEqual'}: expected ${show(expected)}, got ${show(actual)}`);
    },
    ok(value, label) {
      if (!value) fail(`${label || 'ok'}: expected a truthy value, got ${show(value)}`);
    },
    throws(fn, pattern, label) {
      try {
        fn();
      } catch (error) {
        if (pattern && !pattern.test(error.message)) fail(`${label || 'throws'}: wrong error "${error.message}"`);
        return;
      }
      fail(`${label || 'throws'}: expected an error`);
    },
  });

  /** A raw vLLM result record, based on a real run, with any fields overridden. */
  function rawRun(overrides) {
    return Object.assign({
      date: '20260923-151902', backend: 'openai-chat', label: null,
      model_id: 'Qwen/Qwen3-4B-Instruct-2507', num_prompts: 160, max_concurrency: 4, duration: 144.88,
      completed: 160, failed: 0, total_input_tokens: 37801, total_output_tokens: 40960,
      request_throughput: 1.1043, output_throughput: 282.7096, total_token_throughput: 543.6156, max_output_tokens_per_s: 292,
      mean_ttft_ms: 49.347, median_ttft_ms: 51.098, std_ttft_ms: 7.225, p50_ttft_ms: 51.098, p95_ttft_ms: 58.051,
      mean_tpot_ms: 14.008, median_tpot_ms: 14.011, std_tpot_ms: 0.130, p50_tpot_ms: 14.011, p95_tpot_ms: 14.203,
      mean_e2el_ms: 3621.416, median_e2el_ms: 3623.455, std_e2el_ms: 34.038, p50_e2el_ms: 3623.455, p95_e2el_ms: 3678.819,
    }, overrides || {});
  }

  /** A validated run, built through the real parser. */
  function run(overrides) {
    const parsed = window.BenchPanel.require('services/resultParser').parseResultText(JSON.stringify(rawRun(overrides)), 'fixture.json');
    if (!parsed.ok) fail(`fixture did not parse: ${parsed.error}`);
    return parsed.data.runs[0];
  }

  window.BenchPanelTests = Object.freeze({ registered, fixtures: Object.freeze({ rawRun, run }) });
})();
