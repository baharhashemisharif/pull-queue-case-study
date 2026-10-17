import type { Logger } from '@repo/logger';
import type { OrgStateManager } from '@repo/queue';
import { Hono } from 'hono';
import { z } from 'zod';

const prioritySchema = z.object({
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)])
});

export function createOrgRoutes(orgState: OrgStateManager, log: Logger) {
  const app = new Hono();

  app.get('/:orgId/state', async (c) => {
    return c.json(await orgState.getOrgState(c.req.param('orgId')));
  });

  // Applies to tasks enqueued from now on; already-queued tasks keep their priority.
  app.put('/:orgId/priority', async (c) => {
    const orgId = c.req.param('orgId');
    const parsed = prioritySchema.safeParse(await c.req.json());
    if (!parsed.success) return c.json({ error: z.prettifyError(parsed.error) }, 400);

    await orgState.setOrgPriority(orgId, parsed.data.priority);
    log.info('Org priority updated', { orgId, priority: parsed.data.priority });
    return c.json(await orgState.getOrgState(orgId));
  });

  return app;
}
