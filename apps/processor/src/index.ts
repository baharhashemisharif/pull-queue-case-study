import 'dotenv/config';
import { setTimeout as sleep } from 'node:timers/promises';
import { QUEUE_NAME, type TaskData } from '@repo/queue';
import { RateLimitStore } from '@repo/shared';
import { Worker } from 'bullmq';
import { createTaskProcessor, simulateRandomError } from './helpers/index.js';
import { env } from './libs/env.js';
import { createLogger } from './libs/logger.js';
import { redis } from './libs/redis.js';

const log = createLogger('processor');

const processTask = createTaskProcessor({
  rateLimits: new RateLimitStore(redis),
  log,
  work: async (_task, dataSource) => {
    await sleep(env.SIMULATED_WORK_MS);
    if (dataSource) simulateRandomError(dataSource);
  }
});

async function main() {
  await redis.ping();
  log.info('Redis connection verified');

  // The worker pulls jobs from Redis at its own pace: `concurrency` is the
  // backpressure valve. Add workers to scale out; none of them need a public URL.
  const worker = new Worker<TaskData>(QUEUE_NAME, processTask, {
    connection: { url: env.REDIS_URL },
    concurrency: env.WORKER_CONCURRENCY
  });

  worker.on('failed', (job, error) => {
    log.error('Job failed', {
      jobId: job?.id,
      orgId: job?.data.orgId,
      attemptsMade: job?.attemptsMade,
      error: error.message
    });
  });

  worker.on('error', (error) => log.error('Worker error', error));

  log.info('Processor started', { queue: QUEUE_NAME, concurrency: env.WORKER_CONCURRENCY });

  const shutdown = async () => {
    log.info('Shutting down: finishing active jobs...');
    await worker.close();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  log.error('Failed to start processor', error);
  process.exit(1);
});
