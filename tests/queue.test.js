import test from "node:test";
import assert from "node:assert/strict";
import { TaskQueue } from "../src/queue.js";

test("runs tasks and returns results", async () => {
  const q = new TaskQueue();
  assert.equal(await q.add(async () => 42), 42);
});

test("retries a flaky task", async () => {
  const q = new TaskQueue({ baseDelayMs: 1 });
  let calls = 0;
  const out = await q.add(async () => { if (++calls < 3) throw new Error("x"); return "ok"; });
  assert.equal(out, "ok");
  assert.equal(calls, 3);
});

test("respects concurrency", async () => {
  const q = new TaskQueue({ concurrency: 2 });
  let live = 0, peak = 0;
  const job = async () => { peak = Math.max(peak, ++live); await new Promise((r) => setTimeout(r, 10)); live--; };
  await Promise.all([1, 2, 3, 4, 5].map(() => q.add(job)));
  assert.equal(peak, 2);
});
