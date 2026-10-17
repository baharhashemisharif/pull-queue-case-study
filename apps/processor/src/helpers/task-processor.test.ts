import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { noopLogger } from '@repo/logger';
import type { TaskData } from '@repo/queue';
import { getRateLimitPauseMs, type RateLimitReader } from '@repo/shared';
import { DelayedError } from 'bullmq';
import { ProcessingError, RateLimitError } from './errors.js';
import { createTaskProcessor, type ProcessableJob } from './task-processor.js';

const NOW = 1_000_000;

/** In-memory stand-in for the Redis store, with the same keep-existing-window rule. */
class FakeRateLimits implements RateLimitReader {
  resets = new Map<string, number>();

  async getResetAt(dataSource: string) {
    return this.resets.get(dataSource) ?? null;
  }

  async pause(dataSource: string, durationMs: number) {
    const existing = this.resets.get(dataSource);
    if (existing !== undefined && existing > NOW) return existing;
    this.resets.set(dataSource, NOW + durationMs);
    return NOW + durationMs;
  }
}

function makeJob(dataSource = 'google-ads') {
  const delayedUntil: number[] = [];
  const data: TaskData = { orgId: 'acme-corp', type: 'fetch', connectorId: null, payload: { dataSource } };
  const job: ProcessableJob = {
    id: '1',
    data,
    moveToDelayed: async (timestamp: number) => {
      delayedUntil.push(timestamp);
    }
  };
  return { job, delayedUntil };
}

function setup(work: () => Promise<void>) {
  const rateLimits = new FakeRateLimits();
  let calls = 0;
  const processTask = createTaskProcessor({
    rateLimits,
    log: noopLogger,
    work: async () => {
      calls++;
      await work();
    },
    resumeJitterMs: 0,
    now: () => NOW
  });
  return { rateLimits, processTask, workCalls: () => calls };
}

describe('createTaskProcessor', () => {
  it('runs the work when the provider is not paused', async () => {
    const { processTask, workCalls } = setup(async () => {});
    const { job, delayedUntil } = makeJob();

    await processTask(job);

    assert.equal(workCalls(), 1);
    assert.deepEqual(delayedUntil, []);
  });

  it('defers without calling the provider while it is paused', async () => {
    const { processTask, rateLimits, workCalls } = setup(async () => {});
    rateLimits.resets.set('google-ads', NOW + 30_000);
    const { job, delayedUntil } = makeJob();

    await assert.rejects(processTask(job), DelayedError);

    assert.equal(workCalls(), 0);
    assert.deepEqual(delayedUntil, [NOW + 30_000]);
  });

  it('pauses the provider for everyone on a rate-limit error, using the configured pause', async () => {
    const { processTask, rateLimits } = setup(async () => {
      throw new RateLimitError('google-ads');
    });
    const { job, delayedUntil } = makeJob();

    await assert.rejects(processTask(job), DelayedError);

    const expected = NOW + getRateLimitPauseMs('google-ads');
    assert.equal(rateLimits.resets.get('google-ads'), expected);
    assert.deepEqual(delayedUntil, [expected]);
  });

  it("honours the provider's Retry-After when it sends one", async () => {
    const { processTask, rateLimits } = setup(async () => {
      throw new RateLimitError('google-ads', 90_000);
    });

    await assert.rejects(processTask(makeJob().job), DelayedError);

    assert.equal(rateLimits.resets.get('google-ads'), NOW + 90_000);
  });

  it('does not extend a pause another worker already set', async () => {
    // This job passed the paused-check, then another worker paused the
    // provider while the request was in flight, and this request was limited too.
    const { processTask, rateLimits } = setup(async () => {
      rateLimits.resets.set('google-ads', NOW + 10_000);
      throw new RateLimitError('google-ads', 600_000);
    });
    const { job, delayedUntil } = makeJob();

    await assert.rejects(processTask(job), DelayedError);

    assert.equal(rateLimits.resets.get('google-ads'), NOW + 10_000);
    assert.deepEqual(delayedUntil, [NOW + 10_000]);
  });

  it('rethrows other errors so BullMQ retries them with backoff', async () => {
    const { processTask, rateLimits } = setup(async () => {
      throw new ProcessingError('boom');
    });

    await assert.rejects(processTask(makeJob().job), ProcessingError);

    assert.equal(rateLimits.resets.size, 0);
  });

  it('adds jitter so resumed jobs do not stampede the provider', async () => {
    const rateLimits = new FakeRateLimits();
    rateLimits.resets.set('google-ads', NOW + 30_000);
    const processTask = createTaskProcessor({
      rateLimits,
      log: noopLogger,
      work: async () => {},
      resumeJitterMs: 5_000,
      now: () => NOW,
      random: () => 0.5
    });
    const { job, delayedUntil } = makeJob();

    await assert.rejects(processTask(job), DelayedError);

    assert.deepEqual(delayedUntil, [NOW + 30_000 + 2_500]);
  });
});
