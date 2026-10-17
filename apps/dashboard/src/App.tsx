import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { ActiveTasksTable } from '@/components/active-tasks-table';
import { DataSourceChart } from '@/components/data-source-chart';
import { FilteredTasksView } from '@/components/filtered-tasks-view';
import { OrgBreakdownChart } from '@/components/org-breakdown-chart';
import { RateLimitedPlatforms } from '@/components/rate-limited-platforms';
import { StatsCards } from '@/components/stats-cards';
import { TaskGenerator } from '@/components/task-generator';
import { WorkloadChart } from '@/components/workload-chart';
import {
  clearAllQueueData,
  getActiveTasks,
  getFailedTasks,
  getQueueStats,
  getRateLimitedPlatforms,
  getWaitingTasks,
  retryTask
} from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000, // Auto-refresh every 5 seconds
      staleTime: 2000
    }
  }
});

function Dashboard() {
  const client = useQueryClient();

  const {
    data: stats,
    isLoading: statsLoading,
    dataUpdatedAt
  } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: getQueueStats
  });

  const { data: activeTasks, isLoading: activeLoading } = useQuery({
    queryKey: ['active-tasks'],
    queryFn: getActiveTasks
  });

  const { data: waitingTasks, isLoading: waitingLoading } = useQuery({
    queryKey: ['waiting-tasks'],
    queryFn: () => getWaitingTasks(100)
  });

  const { data: failedTasks, isLoading: failedLoading } = useQuery({
    queryKey: ['failed-tasks'],
    queryFn: () => getFailedTasks(50)
  });

  const { data: rateLimitedData, isLoading: rateLimitedLoading } = useQuery({
    queryKey: ['rate-limited-platforms'],
    queryFn: getRateLimitedPlatforms
  });

  const allTasks = [...(activeTasks ?? []), ...(waitingTasks ?? [])];

  const handleRefresh = useCallback(() => {
    client.invalidateQueries();
  }, [client]);

  const clearMutation = useMutation({
    mutationFn: clearAllQueueData,
    onSuccess: () => {
      handleRefresh();
    }
  });

  const handleClearAll = useCallback(() => {
    if (
      window.confirm(
        'Are you sure you want to clear all queue data? This will remove all waiting, completed, failed, and delayed tasks.'
      )
    ) {
      clearMutation.mutate();
    }
  }, [clearMutation]);

  const handleRetryTask = useCallback(
    async (taskId: string) => {
      await retryTask(taskId);
      handleRefresh();
    },
    [handleRefresh]
  );

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-primary p-2'>
              <Activity className='h-5 w-5 text-primary-foreground' />
            </div>
            <div>
              <h1 className='font-bold text-xl'>Queue Dashboard</h1>
              <p className='text-muted-foreground text-xs'>Real-time task monitoring</p>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <span className='text-muted-foreground text-sm'>
              Last updated: {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
            <button
              type='button'
              onClick={handleClearAll}
              disabled={clearMutation.isPending}
              className='flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 font-medium text-destructive text-sm transition-colors hover:bg-destructive/20 disabled:opacity-50'
            >
              <Trash2 className='h-4 w-4' />
              {clearMutation.isPending ? 'Clearing...' : 'Clear All'}
            </button>
            <button
              type='button'
              onClick={handleRefresh}
              className='flex items-center gap-2 rounded-md border bg-background px-3 py-2 font-medium text-sm transition-colors hover:bg-accent'
            >
              <RefreshCw className='h-4 w-4' />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='container px-4 py-8'>
        <div className='space-y-8'>
          {/* Stats Overview */}
          <section>
            <h2 className='mb-4 font-semibold text-lg'>Overview</h2>
            <StatsCards stats={stats} isLoading={statsLoading} />
          </section>

          {/* Task Generator */}
          <section>
            <TaskGenerator onGenerate={handleRefresh} />
          </section>

          {/* Charts Row */}
          <section>
            <h2 className='mb-4 font-semibold text-lg'>Analytics</h2>
            <div className='grid gap-6 lg:grid-cols-3'>
              <WorkloadChart stats={stats} isLoading={statsLoading} />
              <OrgBreakdownChart tasks={allTasks} isLoading={activeLoading || waitingLoading} />
              <DataSourceChart tasks={allTasks} isLoading={activeLoading || waitingLoading} />
            </div>
          </section>

          {/* Filtered View by Org/DataSource */}
          <section>
            <h2 className='mb-4 font-semibold text-lg'>Task Explorer</h2>
            <FilteredTasksView
              activeTasks={activeTasks ?? []}
              waitingTasks={waitingTasks ?? []}
              failedTasks={failedTasks ?? []}
              isLoading={activeLoading || waitingLoading || failedLoading}
              onRetryTask={handleRetryTask}
            />
          </section>

          {/* Rate Limits */}
          <section>
            <h2 className='mb-4 font-semibold text-lg'>Status</h2>
            <RateLimitedPlatforms
              platforms={rateLimitedData?.rateLimitedPlatforms ?? []}
              isLoading={rateLimitedLoading}
            />
          </section>

          {/* Tasks Tables */}
          <section>
            <h2 className='mb-4 font-semibold text-lg'>Task Details</h2>
            <div className='grid gap-6 lg:grid-cols-2'>
              <ActiveTasksTable
                tasks={activeTasks ?? []}
                isLoading={activeLoading}
                title='Active Tasks'
                description='Tasks currently being processed'
                variant='active'
              />
              <ActiveTasksTable
                tasks={waitingTasks ?? []}
                isLoading={waitingLoading}
                title='Waiting Tasks'
                description='Tasks waiting to be processed'
                variant='waiting'
              />
            </div>
          </section>

          {/* Failed Tasks */}
          <section>
            <ActiveTasksTable
              tasks={failedTasks ?? []}
              isLoading={failedLoading}
              title='Failed Tasks'
              description='Tasks that failed during processing'
              variant='failed'
              onRetryTask={handleRetryTask}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t py-6'>
        <div className='container px-4 text-center text-muted-foreground text-sm'>
          Queue Dashboard - Auto-refreshes every 5 seconds
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
