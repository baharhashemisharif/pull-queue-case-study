import type { TaskData } from '@repo/queue';
import type { Job, JobProgress } from 'bullmq';

/** The job fields the API exposes. */
export interface MappedJob {
  id: string | undefined;
  name: string;
  data: TaskData;
  progress: JobProgress;
  timestamp: number;
  processedOn: number | undefined;
  finishedOn: number | undefined;
  attemptsMade: number;
  failedReason?: string;
}

export function mapJob(job: Job<TaskData>): MappedJob {
  return {
    id: job.id,
    name: job.name,
    data: job.data,
    progress: job.progress,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason
  };
}
