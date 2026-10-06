/*
 * Works through a list of jobs with a fixed number running at once, in list order.
 * Stops handing out new jobs when the signal aborts or a job asks to stop; jobs already running finish.
 */
BenchPanel.define('utils/taskPool', [], () => {
  'use strict';

  /**
   * @template T
   * @param {T[]} jobs
   * @param {number} concurrency
   * @param {(job: T, index: number) => Promise<boolean|void>} worker  return true to stop handing out jobs
   * @param {AbortSignal} [signal]
   * @returns {Promise<void>}
   */
  async function runPool(jobs, concurrency, worker, signal) {
    let next = 0;
    let stopped = false;
    async function lane() {
      while (!stopped && next < jobs.length && !(signal && signal.aborted)) {
        const index = next;
        next += 1;
        if (await worker(jobs[index], index)) stopped = true;
      }
    }
    const lanes = Array.from({ length: Math.max(1, Math.min(concurrency, jobs.length)) }, lane);
    await Promise.all(lanes);
  }

  return { runPool };
});
