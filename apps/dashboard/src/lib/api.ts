import type {
  DataSourceBreakdown,
  DateRange,
  OrgBreakdown,
  QueueStats,
  RateLimitedPlatform,
  StatusCounts,
  Task
} from './types';

// Vite proxies /api to the generator (see vite.config.ts).
const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body && typeof body.error === 'string' ? body.error : response.statusText;
    throw new Error(`API error ${response.status}: ${message}`);
  }
  return response.json();
}

export const getQueueStats = () => request<QueueStats>('/queue/stats');
export const getActiveTasks = () => request<Task[]>('/queue/jobs/active');
export const getWaitingTasks = (limit = 50) => request<Task[]>(`/queue/jobs/waiting?limit=${limit}`);
export const getFailedTasks = (limit = 50) => request<Task[]>(`/queue/jobs/failed?limit=${limit}`);
export const getRateLimitedPlatforms = () => request<{ rateLimitedPlatforms: RateLimitedPlatform[] }>('/rate-limits');

export const retryTask = (taskId: string) =>
  request<{ message: string; taskId: string }>(`/queue/jobs/${taskId}/retry`, { method: 'POST' });

export const clearAllQueueData = () =>
  request<{ message: string; clearedRateLimits: number }>('/queue/clear', { method: 'DELETE' });

export const generateTasks = (count: number) =>
  request<{ count: number; taskIds: string[] }>('/tasks/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count })
  });

// ---------------------------------------------------------------------------
// Client-side grouping and filtering
// ---------------------------------------------------------------------------

export function getTaskDataSource(task: Task): string | undefined {
  const value = task.data.payload?.dataSource;
  return typeof value === 'string' ? value : undefined;
}

type TasksByStatus = Record<keyof StatusCounts, Task[]>;

function countBy(tasks: TasksByStatus, keyOf: (task: Task) => string): Map<string, StatusCounts> {
  const counts = new Map<string, StatusCounts>();
  for (const status of ['active', 'waiting', 'failed'] as const) {
    for (const task of tasks[status]) {
      const key = keyOf(task);
      const entry = counts.get(key) ?? { active: 0, waiting: 0, failed: 0 };
      entry[status]++;
      counts.set(key, entry);
    }
  }
  return counts;
}

const total = (c: StatusCounts) => c.active + c.waiting + c.failed;

export function computeOrgBreakdown(tasks: TasksByStatus): OrgBreakdown[] {
  return [...countBy(tasks, (task) => task.data.orgId)]
    .map(([orgId, counts]) => ({ orgId, ...counts }))
    .sort((a, b) => total(b) - total(a));
}

export function computeDataSourceBreakdown(tasks: TasksByStatus): DataSourceBreakdown[] {
  return [...countBy(tasks, (task) => getTaskDataSource(task) ?? 'unknown')]
    .map(([dataSource, counts]) => ({ dataSource, ...counts }))
    .sort((a, b) => total(b) - total(a));
}

export function filterTasksByOrg(tasks: Task[], orgId: string): Task[] {
  return tasks.filter((task) => task.data.orgId === orgId);
}

export function filterTasksByDataSource(tasks: Task[], dataSource: string): Task[] {
  return tasks.filter((task) => getTaskDataSource(task) === dataSource);
}

export function filterTasksByDateRange(tasks: Task[], { from, to }: DateRange): Task[] {
  if (!from && !to) return tasks;
  return tasks.filter((task) => {
    const created = new Date(task.timestamp);
    return (!from || created >= from) && (!to || created <= to);
  });
}
