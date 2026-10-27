export class TaskQueue {
  constructor({ concurrency = 2, maxRetries = 3, baseDelayMs = 50 } = {}) {
    this.concurrency = concurrency;
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
    this.pending = [];
    this.running = 0;
    this.waiters = [];
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.pending.push({ fn, resolve, reject, attempt: 0 });
      this.#next();
    });
  }

  drain() {
    if (this.running === 0 && this.pending.length === 0) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  #next() {
    while (this.running < this.concurrency && this.pending.length) {
      const job = this.pending.shift();
      this.running++;
      this.#run(job).finally(() => {
        this.running--;
        this.#next();
        if (this.running === 0 && this.pending.length === 0) {
          this.waiters.splice(0).forEach((w) => w());
        }
      });
    }
  }

  async #run(job) {
    try {
      job.resolve(await job.fn());
    } catch (err) {
      if (job.attempt >= this.maxRetries) return job.reject(err);
      const delay = this.baseDelayMs * 2 ** job.attempt;
      job.attempt++;
      await new Promise((r) => setTimeout(r, delay));
      this.pending.unshift(job);
    }
  }
}
