export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  prioritized: number;
}

export interface TaskData {
  orgId: string;
  type: string;
  connectorId: string | null;
  payload: Record<string, unknown>;
}

export interface Task {
  id: string;
  name: string;
  data: TaskData;
  progress: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  attemptsMade: number;
  failedReason?: string;
}

export interface StatusCounts {
  active: number;
  waiting: number;
  failed: number;
}

export interface OrgBreakdown extends StatusCounts {
  orgId: string;
}

export interface DataSourceBreakdown extends StatusCounts {
  dataSource: string;
}

export interface RateLimitedPlatform {
  platform: string;
  resetAt: number;
  resetAtISO: string;
  remainingMinutes: number;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}
