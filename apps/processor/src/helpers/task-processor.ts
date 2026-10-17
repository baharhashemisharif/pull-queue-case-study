import type { Logger } from '@repo/logger';
import type { TaskData } from '@repo/queue';
import { getRateLimitPauseMs, type RateLimitReader } from '@repo/shared';
import { DelayedError, type Job } from 'bullmq';
import { RateLimitError } from './errors.js';

/** The parts of a BullMQ job the processor touches. */
export type ProcessableJob = Pick<Job<TaskData>, 'id' | 'data' | 'moveToDelayed'>;

export interface TaskProcessorDeps {
  rateLimits: RateLimitReader;
  log: Logger;
  /** The actual work. In this demo it sleeps and randomly fails. */
  work: (task: TaskData, dataSource: string | undefined) => Promise<void>;
  /** Spread resumed jobs over this window so they don't all hit the provider at once. */
  resumeJitterMs?: number;
  now?: () => number;
  random?: () => number;
}

function getDataSource(task: TaskData): string | undefined {
  const value = task.payload.dataSource;
  return typeof value === 'string' ? value : undefined;
}

/**
 * Builds the function a BullMQ worker runs for each job it pulls.
 *
 * Rate limits are handled outside BullMQ's retry budget: the job is moved back
 * to the delayed set until the provider's pause ends, and `attemptsMade` is
 * left alone. Only real failures count towards `attempts`.
 */
export function createTaskProcessor(deps: TaskProcessorDeps) {
  const { rateLimits, log, work, resumeJitterMs = 5_000, now = Date.now, random = Math.random } = deps;

  async function defer(job: ProcessableJob, resetAt: number, token: string | undefined): Promise<never> {
    const resumeAt = resetAt + Math.floor(random() * resumeJitterMs);
    await job.moveToDelayed(resumeAt, token);
    // Tells the worker the job was rescheduled on purpose, not failed.
    throw new DelayedError();
  }

  return async function processTask(job: ProcessableJob, token?: string): Promise<void> {
    const task = job.data;
    const dataSource = getDataSource(task);

    if (dataSource) {
      const resetAt = await rateLimits.getResetAt(dataSource);
      if (resetAt !== null && resetAt > now()) {
        log.debug('Provider paused, deferring job', { jobId: job.id, dataSource, resetAt });
        await defer(job, resetAt, token);
      }
    }

    try {
      await work(task, dataSource);
    } catch (error) {
      if (error instanceof RateLimitError) {
        const pauseMs = error.retryAfterMs ?? getRateLimitPauseMs(error.dataSource);
        const resetAt = await rateLimits.pause(error.dataSource, pauseMs);
        log.warn('Provider rate limited, pausing it for all workers', {
          jobId: job.id,
          dataSource: error.dataSource,
          resetAt: new Date(resetAt).toISOString()
        });
        await defer(job, resetAt, token);
      }
      throw error;
    }

    log.info('Task completed', { jobId: job.id, orgId: task.orgId, dataSource });
  };
}
