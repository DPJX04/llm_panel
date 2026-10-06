(function () {
  'use strict';

  const taskPool = BenchPanel.require('utils/taskPool');

  function pause() {
    return new Promise((resolve) => setTimeout(resolve, 1));
  }

  test('task pool: never more jobs in flight than allowed, and every job runs once', async () => {
    let running = 0;
    let peak = 0;
    const done = [];
    await taskPool.runPool([1, 2, 3, 4, 5, 6, 7], 3, async (job) => {
      running += 1;
      peak = Math.max(peak, running);
      await pause();
      running -= 1;
      done.push(job);
    });
    assert.equal(peak, 3);
    assert.deepEqual(done.slice().sort(), [1, 2, 3, 4, 5, 6, 7]);
  });

  test('task pool: a job returning true, or an abort, stops new jobs from starting', async () => {
    const started = [];
    await taskPool.runPool([1, 2, 3, 4], 1, async (job) => { started.push(job); return job === 2; });
    assert.deepEqual(started, [1, 2]);

    const controller = new AbortController();
    const seen = [];
    await taskPool.runPool([1, 2, 3], 1, async (job) => { seen.push(job); controller.abort(); }, controller.signal);
    assert.deepEqual(seen, [1]);
  });
})();
