import 'dotenv/config';
import { serve } from '@hono/node-server';
import { defaultTaskOptions, QUEUE_NAME, QueueManager } from '@repo/queue';
import { RateLimitStore } from '@repo/shared';
import { Hono } from 'hono';
import { env } from './libs/env.js';
import { createLogger } from './libs/logger.js';
import { redis } from './libs/redis.js';
import {
  createMetaRoutes,
  createOrgRoutes,
  createQueueRoutes,
  createRateLimitRoutes,
  createTaskRoutes
} from './routes/index.js';

const log = createLogger('generator');

const queueManager = new QueueManager(redis, {
  queueName: QUEUE_NAME,
  redisUrl: env.REDIS_URL,
  defaultTaskOptions,
  defaultPriority: 2
});
const rateLimits = new RateLimitStore(redis);

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/', createMetaRoutes());
app.route('/tasks', createTaskRoutes(queueManager, log));
app.route('/orgs', createOrgRoutes(queueManager.getOrgStateManager(), log));
app.route('/queue', createQueueRoutes(queueManager, rateLimits, log));
app.route('/rate-limits', createRateLimitRoutes(rateLimits));

app.onError((error, c) => {
  log.error('Unhandled error', error);
  return c.json({ error: 'Internal server error' }, 500);
});

async function main() {
  await redis.ping();
  log.info('Redis connection verified');

  serve({ fetch: app.fetch, port: env.PORT }, (info) => {
    log.info(`Generator listening on http://localhost:${info.port}`);
  });
}

main().catch((error) => {
  log.error('Failed to start server', error);
  process.exit(1);
});
