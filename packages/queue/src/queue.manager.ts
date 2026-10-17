import type { Job, Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { createQueue } from './queue.config.js';
import { OrgStateManager } from './queue.org-state.js';
import type { AddTaskParams, OrgPriority, QueueConfig, TaskData } from './queue.types.js';

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  prioritized: number;
}

/**
 * Producer side of the queue: enqueues tasks with their organisation's
 * priority. Workers pull from the same queue independently.
 */
export class QueueManager {
  private queue: Queue<TaskData>;
  private orgState: OrgStateManager;

  constructor(redis: Redis, config: QueueConfig) {
    this.queue = createQueue(config);
    this.orgState = new OrgStateManager(redis, config.defaultPriority);
  }

  async addTask(params: AddTaskParams): Promise<Job<TaskData>> {
    const [job] = await this.addTasks([params]);
    if (!job) throw new Error('Queue did not return the added job');
    return job;
  }

  async addTasks(tasks: AddTaskParams[]): Promise<Job<TaskData>[]> {
    // Look each org's priority up once, not once per task.
    const priorities = new Map<string, OrgPriority>();
    for (const { orgId } of tasks) {
      if (!priorities.has(orgId)) {
        priorities.set(orgId, (await this.orgState.getOrgState(orgId)).priority);
      }
    }

    return this.queue.addBulk(
      tasks.map((task) => ({
        name: task.type,
        data: {
          orgId: task.orgId,
          type: task.type,
          connectorId: task.connectorId ?? null,
          payload: task.payload
        },
        opts: { priority: priorities.get(task.orgId) }
      }))
    );
  }

  async getQueueStats(): Promise<QueueStats> {
    const counts = await this.queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'prioritized');
    return {
      waiting: counts.waiting ?? 0,
      active: counts.active ?? 0,
      completed: counts.completed ?? 0,
      failed: counts.failed ?? 0,
      delayed: counts.delayed ?? 0,
      prioritized: counts.prioritized ?? 0
    };
  }

  getOrgStateManager(): OrgStateManager {
    return this.orgState;
  }

  getQueue(): Queue<TaskData> {
    return this.queue;
  }

  async close(): Promise<void> {
    await this.queue.close();
  }
}
