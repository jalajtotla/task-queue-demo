# task-queue-demo

A small in-memory task queue with retry and exponential backoff, written in plain Node.js (no dependencies).
Built as a sample project for an interview walkthrough.

## Design
- `TaskQueue` holds pending tasks and runs up to `concurrency` at once.
- A failed task is retried up to `maxRetries` times, waiting `baseDelayMs * 2^attempt` between tries.
- `drain()` resolves when the queue is empty and nothing is running.

## Run
    node --test tests/
