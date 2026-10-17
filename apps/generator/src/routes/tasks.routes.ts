import type { Logger } from '@repo/logger';
import type { QueueManager } from '@repo/queue';
import { getAllDataSources } from '@repo/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import { generateTestTasks, TEST_ORGS } from '../helpers/index.js';

const taskType = z.enum(['fetch', 'process', 'sync']);

const taskSchema = z.object({
  orgId: z.string().min(1),
  type: taskType.default('fetch'),
  payload: z.record(z.string(), z.unknown()).default({}),
  connectorId: z.string().optional()
});

const bulkSchema = z.object({ tasks: z.array(taskSchema).min(1).max(10_000) });

const generateSchema = z.object({
  count: z.number().int().min(1).max(10_000).default(10),
  orgId: z.string().min(1).optional(),
  type: taskType.default('fetch')
});

export function createTaskRoutes(queueManager: QueueManager, log: Logger) {
  const app = new Hono();

  app.post('/', async (c) => {
    const parsed = taskSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: z.prettifyError(parsed.error) }, 400);

    const job = await queueManager.addTask(parsed.data);
    log.info('Task added', { taskId: job.id, orgId: parsed.data.orgId });
    return c.json({ taskId: job.id, name: job.name }, 201);
  });

  app.post('/bulk', async (c) => {
    const parsed = bulkSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: z.prettifyError(parsed.error) }, 400);

    const jobs = await queueManager.addTasks(parsed.data.tasks);
    log.info('Bulk tasks added', { count: jobs.length });
    return c.json({ count: jobs.length, taskIds: jobs.map((job) => job.id) }, 201);
  });

  // Demo helper: enqueue N random tasks spread across test orgs and providers.
  app.post('/generate', async (c) => {
    const parsed = generateSchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: z.prettifyError(parsed.error) }, 400);

    const { count, orgId, type } = parsed.data;
    const jobs = await queueManager.addTasks(generateTestTasks(count, { orgId, type }));
    log.info('Test tasks generated', { count: jobs.length });
    return c.json({ count: jobs.length, taskIds: jobs.map((job) => job.id) }, 201);
  });

  return app;
}

export function createMetaRoutes() {
  const app = new Hono();
  app.get('/data-sources', (c) => c.json({ dataSources: getAllDataSources() }));
  app.get('/test-orgs', (c) => c.json({ testOrgs: TEST_ORGS }));
  return app;
}
