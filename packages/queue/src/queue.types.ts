import type { JobsOptions } from 'bullmq';

export type TaskType = 'fetch' | 'process' | 'sync';

/**
 * BullMQ priority: lower numbers are picked first.
 * 1 = high (e.g. paying tier), 2 = normal, 3 = low (e.g. backfills).
 */
export type OrgPriority = 1 | 2 | 3;

export interface OrgQueueState {
  priority: OrgPriority;
}

/** The data stored on every job in the queue. */
export interface TaskData {
  orgId: string;
  type: TaskType;
  connectorId: string | null;
  payload: Record<string, unknown>;
}

export interface AddTaskParams {
  orgId: string;
  type: TaskType;
  payload: Record<string, unknown>;
  connectorId?: string;
}

export interface QueueConfig {
  queueName: string;
  redisUrl: string;
  defaultTaskOptions: JobsOptions;
  defaultPriority: OrgPriority;
}
