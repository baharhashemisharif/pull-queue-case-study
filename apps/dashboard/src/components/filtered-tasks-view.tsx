import { AlertCircle, Building2, ChevronRight, Clock, Database, Play, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateRangeFilter } from '@/components/date-range-filter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  computeDataSourceBreakdown,
  computeOrgBreakdown,
  filterTasksByDataSource,
  filterTasksByDateRange,
  filterTasksByOrg
} from '@/lib/api';
import type { DateRange, Task } from '@/lib/types';

interface FilteredTasksViewProps {
  activeTasks: Task[];
  waitingTasks: Task[];
  failedTasks: Task[];
  isLoading: boolean;
  onRetryTask?: (taskId: string) => Promise<void>;
}

export function FilteredTasksView({
  activeTasks,
  waitingTasks,
  failedTasks,
  isLoading,
  onRetryTask
}: FilteredTasksViewProps) {
  const [mainTab, setMainTab] = useState<string>('org');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });

  // Apply date filter first
  const dateFilteredActiveTasks = useMemo(
    () => filterTasksByDateRange(activeTasks, dateRange),
    [activeTasks, dateRange]
  );
  const dateFilteredWaitingTasks = useMemo(
    () => filterTasksByDateRange(waitingTasks, dateRange),
    [waitingTasks, dateRange]
  );
  const dateFilteredFailedTasks = useMemo(
    () => filterTasksByDateRange(failedTasks, dateRange),
    [failedTasks, dateRange]
  );

  const tasksByStatus = useMemo(
    () => ({ active: dateFilteredActiveTasks, waiting: dateFilteredWaitingTasks, failed: dateFilteredFailedTasks }),
    [dateFilteredActiveTasks, dateFilteredWaitingTasks, dateFilteredFailedTasks]
  );

  const orgBreakdown = useMemo(() => computeOrgBreakdown(tasksByStatus), [tasksByStatus]);
  const dataSourceBreakdown = useMemo(() => computeDataSourceBreakdown(tasksByStatus), [tasksByStatus]);

  // Count total tasks after date filter (for showing filter status)
  const totalTasksBeforeDateFilter = activeTasks.length + waitingTasks.length + failedTasks.length;
  const totalTasksAfterDateFilter =
    dateFilteredActiveTasks.length + dateFilteredWaitingTasks.length + dateFilteredFailedTasks.length;
  const hasDateFilter = dateRange.from !== null || dateRange.to !== null;

  // Filtered tasks based on selection (using date-filtered tasks)
  const filteredActiveTasks = useMemo(() => {
    if (mainTab === 'org' && selectedOrg) {
      return filterTasksByOrg(dateFilteredActiveTasks, selectedOrg);
    }
    if (mainTab === 'datasource' && selectedDataSource) {
      return filterTasksByDataSource(dateFilteredActiveTasks, selectedDataSource);
    }
    return [];
  }, [mainTab, selectedOrg, selectedDataSource, dateFilteredActiveTasks]);

  const filteredWaitingTasks = useMemo(() => {
    if (mainTab === 'org' && selectedOrg) {
      return filterTasksByOrg(dateFilteredWaitingTasks, selectedOrg);
    }
    if (mainTab === 'datasource' && selectedDataSource) {
      return filterTasksByDataSource(dateFilteredWaitingTasks, selectedDataSource);
    }
    return [];
  }, [mainTab, selectedOrg, selectedDataSource, dateFilteredWaitingTasks]);

  const filteredFailedTasks = useMemo(() => {
    if (mainTab === 'org' && selectedOrg) {
      return filterTasksByOrg(dateFilteredFailedTasks, selectedOrg);
    }
    if (mainTab === 'datasource' && selectedDataSource) {
      return filterTasksByDataSource(dateFilteredFailedTasks, selectedDataSource);
    }
    return [];
  }, [mainTab, selectedOrg, selectedDataSource, dateFilteredFailedTasks]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className='flex h-[400px] items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4'>
          <div>
            <CardTitle>Filter by Category</CardTitle>
            <CardDescription>View tasks grouped by organization or data source</CardDescription>
          </div>

          {/* Date Range Filter */}
          <div className='border-t pt-2'>
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            {hasDateFilter && (
              <p className='mt-2 text-muted-foreground text-xs'>
                Showing {totalTasksAfterDateFilter} of {totalTasksBeforeDateFilter} tasks
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          value={mainTab}
          onValueChange={(v) => {
            setMainTab(v);
            setSelectedOrg(null);
            setSelectedDataSource(null);
          }}
        >
          <TabsList className='mb-4'>
            <TabsTrigger value='org'>
              <Building2 className='mr-2 h-4 w-4' />
              By Organization
            </TabsTrigger>
            <TabsTrigger value='datasource'>
              <Database className='mr-2 h-4 w-4' />
              By Data Source
            </TabsTrigger>
          </TabsList>

          <TabsContent value='org'>
            <div className='grid gap-4 lg:grid-cols-2'>
              {/* Org List */}
              <div className='space-y-2'>
                <h4 className='mb-3 font-medium text-muted-foreground text-sm'>
                  Organizations ({orgBreakdown.length})
                </h4>
                <div className='max-h-[400px] space-y-1 overflow-y-auto'>
                  {orgBreakdown.length === 0 ? (
                    <p className='py-8 text-center text-muted-foreground text-sm'>No organizations found</p>
                  ) : (
                    orgBreakdown.map((org) => (
                      <button
                        type='button'
                        key={org.orgId}
                        onClick={() => setSelectedOrg(org.orgId)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 transition-colors ${
                          selectedOrg === org.orgId
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent hover:bg-muted/50'
                        }`}
                      >
                        <div className='flex items-center gap-3'>
                          <Building2 className='h-4 w-4 text-muted-foreground' />
                          <span className='font-medium text-sm'>{org.orgId}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <StatusBadges active={org.active} waiting={org.waiting} failed={org.failed} />
                          <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Org Details */}
              <div>
                {selectedOrg ? (
                  <OrgOrDataSourceDetails
                    title={selectedOrg}
                    subtitle='Organization'
                    activeTasks={filteredActiveTasks}
                    waitingTasks={filteredWaitingTasks}
                    failedTasks={filteredFailedTasks}
                    onRetryTask={onRetryTask}
                  />
                ) : (
                  <div className='flex h-[400px] items-center justify-center rounded-lg border border-dashed text-muted-foreground'>
                    Select an organization to view details
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value='datasource'>
            <div className='grid gap-4 lg:grid-cols-2'>
              {/* Data Source List */}
              <div className='space-y-2'>
                <h4 className='mb-3 font-medium text-muted-foreground text-sm'>
                  Data Sources ({dataSourceBreakdown.length})
                </h4>
                <div className='max-h-[400px] space-y-1 overflow-y-auto'>
                  {dataSourceBreakdown.length === 0 ? (
                    <p className='py-8 text-center text-muted-foreground text-sm'>No data sources found</p>
                  ) : (
                    dataSourceBreakdown.map((ds) => (
                      <button
                        type='button'
                        key={ds.dataSource}
                        onClick={() => setSelectedDataSource(ds.dataSource)}
                        className={`flex w-full items-center justify-between rounded-lg border p-3 transition-colors ${
                          selectedDataSource === ds.dataSource
                            ? 'border-primary bg-primary/10'
                            : 'border-transparent hover:bg-muted/50'
                        }`}
                      >
                        <div className='flex items-center gap-3'>
                          <Database className='h-4 w-4 text-muted-foreground' />
                          <span className='font-medium text-sm'>{ds.dataSource}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <StatusBadges active={ds.active} waiting={ds.waiting} failed={ds.failed} />
                          <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Data Source Details */}
              <div>
                {selectedDataSource ? (
                  <OrgOrDataSourceDetails
                    title={selectedDataSource}
                    subtitle='Data Source'
                    activeTasks={filteredActiveTasks}
                    waitingTasks={filteredWaitingTasks}
                    failedTasks={filteredFailedTasks}
                    onRetryTask={onRetryTask}
                  />
                ) : (
                  <div className='flex h-[400px] items-center justify-center rounded-lg border border-dashed text-muted-foreground'>
                    Select a data source to view details
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Status badges component
function StatusBadges({ active, waiting, failed }: { active: number; waiting: number; failed: number }) {
  return (
    <div className='flex items-center gap-1'>
      {active > 0 && (
        <Badge variant='success' className='px-1.5 text-xs'>
          <Play className='mr-1 h-3 w-3' />
          {active}
        </Badge>
      )}
      {waiting > 0 && (
        <Badge variant='warning' className='px-1.5 text-xs'>
          <Clock className='mr-1 h-3 w-3' />
          {waiting}
        </Badge>
      )}
      {failed > 0 && (
        <Badge variant='destructive' className='px-1.5 text-xs'>
          <AlertCircle className='mr-1 h-3 w-3' />
          {failed}
        </Badge>
      )}
    </div>
  );
}

// Details panel for org or data source
interface DetailsProps {
  title: string;
  subtitle: string;
  activeTasks: Task[];
  waitingTasks: Task[];
  failedTasks: Task[];
  onRetryTask?: (taskId: string) => Promise<void>;
}

function OrgOrDataSourceDetails({
  title,
  subtitle,
  activeTasks,
  waitingTasks,
  failedTasks,
  onRetryTask
}: DetailsProps) {
  const [detailTab, setDetailTab] = useState('active');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleViewError = (task: Task) => {
    setSelectedTask(task);
    setErrorDialogOpen(true);
  };

  const handleRetry = async () => {
    if (!selectedTask || !onRetryTask) return;

    setIsRetrying(true);
    try {
      await onRetryTask(selectedTask.id);
      setErrorDialogOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to retry task:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTasksForTab = () => {
    switch (detailTab) {
      case 'active':
        return activeTasks;
      case 'waiting':
        return waitingTasks;
      case 'failed':
        return failedTasks;
      default:
        return [];
    }
  };

  const tasks = getTasksForTab();
  const isFailed = detailTab === 'failed';

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-4'>
        <h3 className='font-semibold text-lg'>{title}</h3>
        <p className='text-muted-foreground text-sm'>{subtitle}</p>
      </div>

      {/* Summary Stats */}
      <div className='mb-4 grid grid-cols-3 gap-2'>
        <div className='rounded-lg bg-green-500/10 p-2 text-center'>
          <div className='font-bold text-green-600 text-lg'>{activeTasks.length}</div>
          <div className='text-muted-foreground text-xs'>Active</div>
        </div>
        <div className='rounded-lg bg-yellow-500/10 p-2 text-center'>
          <div className='font-bold text-lg text-yellow-600'>{waitingTasks.length}</div>
          <div className='text-muted-foreground text-xs'>Waiting</div>
        </div>
        <div className='rounded-lg bg-red-500/10 p-2 text-center'>
          <div className='font-bold text-lg text-red-600'>{failedTasks.length}</div>
          <div className='text-muted-foreground text-xs'>Failed</div>
        </div>
      </div>

      {/* Detail Tabs */}
      <Tabs value={detailTab} onValueChange={setDetailTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='active'>Active</TabsTrigger>
          <TabsTrigger value='waiting'>Waiting</TabsTrigger>
          <TabsTrigger value='failed'>Failed</TabsTrigger>
        </TabsList>

        <div className='mt-3 max-h-[250px] overflow-y-auto'>
          {tasks.length === 0 ? (
            <div className='py-8 text-center text-muted-foreground text-sm'>No {detailTab} tasks</div>
          ) : (
            <div className='space-y-2'>
              {tasks.slice(0, 20).map((task) => (
                <div
                  key={task.id}
                  className={`rounded p-2 text-sm ${isFailed ? 'border border-red-200/50 bg-red-500/5' : 'bg-muted/50'}`}
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex flex-col'>
                      <span className='font-mono text-xs'>{task.id?.slice(0, 12)}</span>
                      <span className='text-muted-foreground text-xs'>{task.data?.connectorId ?? 'No connector'}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='flex flex-col items-end'>
                        <Badge variant='outline' className='text-xs'>
                          {task.data?.type ?? task.name}
                        </Badge>
                        <span className='text-muted-foreground text-xs'>
                          {formatTime(task.processedOn ?? task.timestamp)}
                        </span>
                      </div>
                      {isFailed && (
                        <button
                          type='button'
                          onClick={() => handleViewError(task)}
                          className='flex items-center gap-1 rounded-md border px-1.5 py-1 font-medium text-xs transition-colors hover:bg-accent'
                          title='View error details'
                        >
                          <AlertCircle className='h-3 w-3 text-destructive' />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Show failure reason preview for failed tasks */}
                  {isFailed && task.failedReason && (
                    <button type='button' onClick={() => handleViewError(task)} className='mt-2 w-full text-left'>
                      <div className='flex items-start gap-2 rounded border border-red-200/30 bg-red-500/10 p-2'>
                        <AlertCircle className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-destructive' />
                        <div className='min-w-0 flex-1'>
                          <span className='line-clamp-2 text-destructive text-xs'>{task.failedReason}</span>
                          <span className='mt-1 block text-muted-foreground text-xs hover:underline'>
                            Click to view full error
                          </span>
                        </div>
                      </div>
                    </button>
                  )}
                  {isFailed && !task.failedReason && (
                    <div className='mt-2 flex items-center gap-2 rounded bg-muted/50 p-2 text-muted-foreground text-xs'>
                      <AlertCircle className='h-3.5 w-3.5' />
                      No error details available
                    </div>
                  )}
                </div>
              ))}
              {tasks.length > 20 && (
                <div className='py-2 text-center text-muted-foreground text-xs'>+{tasks.length - 20} more tasks</div>
              )}
            </div>
          )}
        </div>
      </Tabs>

      {/* Error Details Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent onClose={() => setErrorDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-destructive' />
              Failed Task Details
            </DialogTitle>
            <DialogDescription>Complete error information for this task</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className='space-y-4'>
              {/* Task Info */}
              <div className='rounded-lg border bg-muted/50 p-3 text-sm'>
                <h4 className='mb-2 font-medium'>Task Information</h4>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='text-muted-foreground'>Task ID:</div>
                  <div className='font-mono text-xs'>{selectedTask.id}</div>
                  <div className='text-muted-foreground'>Organization:</div>
                  <div>{selectedTask.data?.orgId ?? '-'}</div>
                  <div className='text-muted-foreground'>Type:</div>
                  <div>{selectedTask.data?.type ?? selectedTask.name}</div>
                  <div className='text-muted-foreground'>Connector:</div>
                  <div>{selectedTask.data?.connectorId ?? '-'}</div>
                  <div className='text-muted-foreground'>Attempts:</div>
                  <div>{selectedTask.attemptsMade ?? 0}</div>
                </div>
              </div>

              {/* Error Details */}
              <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3'>
                <h4 className='mb-2 flex items-center gap-2 font-medium text-destructive text-sm'>
                  <AlertCircle className='h-4 w-4' />
                  Error Message
                </h4>
                <div className='max-h-[200px] overflow-y-auto whitespace-pre-wrap break-all rounded bg-destructive/10 p-3 font-mono text-xs'>
                  {selectedTask.failedReason || 'No error message available'}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <button
              type='button'
              onClick={() => setErrorDialogOpen(false)}
              className='rounded-md border px-4 py-2 font-medium text-sm transition-colors hover:bg-accent'
            >
              Close
            </button>
            {onRetryTask && (
              <button
                type='button'
                onClick={handleRetry}
                disabled={isRetrying}
                className='rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50'
              >
                {isRetrying ? (
                  'Retrying...'
                ) : (
                  <>
                    <RotateCcw className='mr-1.5 inline h-4 w-4' />
                    Retry Task
                  </>
                )}
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
