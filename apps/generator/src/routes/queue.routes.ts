import type { Logger } from '@repo/logger';
import type { QueueManager } from '@repo/queue';
import type { RateLimitStore } from '@repo/shared';
import { Hono } from 'hono';
import { mapJob } from '../helpers/index.js';

function parseLimit(value: string | undefined, fallback = 50): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 500) : fallback;
}

export function createQueueRoutes(queueManager: QueueManager, rateLimits: RateLimitStore, log: Logger) {
  const app = new Hono();
  const queue = queueManager.getQueue();

  app.get('/stats', async (c) => c.json(await queueManager.getQueueStats()));

  app.get('/jobs/active', async (c) => c.json((await queue.getActive()).map(mapJob)));

  // BullMQ keeps jobs that have a priority in a separate "prioritized" set,
  // so "waiting" here means both.
  app.get('/jobs/waiting', async (c) => {
    const limit = parseLimit(c.req.query('limit'));
    const jobs = await queue.getJobs(['waiting', 'prioritized'], 0, limit - 1, true);
    return c.json(jobs.map(mapJob));
  });

  app.get('/jobs/failed', async (c) => {
    const limit = parseLimit(c.req.query('limit'));
    return c.json((await queue.getFailed(0, limit - 1)).map(mapJob));
  });

  app.get('/jobs/completed', async (c) => {
    const limit = parseLimit(c.req.query('limit'));
    return c.json((await queue.getCompleted(0, limit - 1)).map(mapJob));
  });

  app.post('/jobs/:id/retry', async (c) => {
    const id = c.req.param('id');
    const job = await queue.getJob(id);
    if (!job) return c.json({ error: 'Job not found' }, 404);

    const state = await job.getState();
    if (state !== 'failed') return c.json({ error: `Job is not failed (current state: ${state})` }, 409);

    await job.retry();
    log.info('Job retried', { jobId: id });
    return c.json({ message: 'Job retried', taskId: id });
  });

  // Dev-only reset: empties the queue and lifts every provider pause.
  app.delete('/clear', async (c) => {
    await queue.obliterate({ force: true });
    const clearedRateLimits = await rateLimits.clear();
    log.info('Queue and rate limits cleared', { clearedRateLimits });
    return c.json({ message: 'Queue cleared', clearedRateLimits });
  });

  return app;
}

export function createRateLimitRoutes(rateLimits: RateLimitStore) {
  const app = new Hono();
  app.get('/', async (c) => c.json({ rateLimitedPlatforms: await rateLimits.list() }));
  return app;
}
