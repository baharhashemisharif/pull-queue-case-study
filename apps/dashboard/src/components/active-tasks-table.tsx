import { AlertCircle, Eye, RotateCcw } from 'lucide-react';
import { useState } from 'react';
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
import type { Task } from '@/lib/types';

interface ActiveTasksTableProps {
  tasks: Task[];
  isLoading: boolean;
  title?: string;
  description?: string;
  variant?: 'active' | 'waiting' | 'failed';
  onRetryTask?: (taskId: string) => Promise<void>;
}

export function ActiveTasksTable({
  tasks,
  isLoading,
  title = 'Active Tasks',
  description = 'Tasks currently being processed',
  variant = 'active',
  onRetryTask
}: ActiveTasksTableProps) {
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const variantStyles = {
    active: 'success',
    waiting: 'warning',
    failed: 'destructive'
  } as const;

  const handleRetryClick = (task: Task) => {
    setSelectedTask(task);
    setRetryDialogOpen(true);
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailsDialogOpen(true);
  };

  const handleConfirmRetry = async () => {
    if (!selectedTask || !onRetryTask) return;

    setIsRetrying(true);
    try {
      await onRetryTask(selectedTask.id);
      setRetryDialogOpen(false);
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

  const formatDuration = (start: number | undefined, end: number | undefined) => {
    if (!start) return '-';
    const endTime = end ?? Date.now();
    const durationMs = endTime - start;
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-[200px] items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : tasks.length === 0 ? (
          <div className='flex h-[200px] items-center justify-center text-muted-foreground'>No {variant} tasks</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b text-left'>
                  <th className='pb-3 font-medium'>Task ID</th>
                  <th className='pb-3 font-medium'>Organization</th>
                  <th className='pb-3 font-medium'>Type</th>
                  <th className='pb-3 font-medium'>Connector</th>
                  <th className='pb-3 font-medium'>Started</th>
                  <th className='pb-3 font-medium'>Duration</th>
                  <th className='pb-3 font-medium'>{variant === 'failed' ? 'Error' : 'Progress'}</th>
                  {variant === 'failed' && <th className='pb-3 font-medium'>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 20).map((task) => (
                  <tr key={task.id} className='border-b last:border-0'>
                    <td className='py-3 font-mono text-xs'>{task.id?.slice(0, 8) ?? '-'}</td>
                    <td className='py-3'>
                      <Badge variant='outline'>{task.data?.orgId ?? '-'}</Badge>
                    </td>
                    <td className='py-3'>
                      <Badge variant={variantStyles[variant]}>{task.data?.type ?? task.name ?? '-'}</Badge>
                    </td>
                    <td className='py-3 text-muted-foreground'>{task.data?.connectorId ?? '-'}</td>
                    <td className='py-3 text-muted-foreground'>{formatTime(task.processedOn ?? task.timestamp)}</td>
                    <td className='py-3 text-muted-foreground'>
                      {formatDuration(task.processedOn ?? task.timestamp, task.finishedOn)}
                    </td>
                    <td className='py-3'>
                      {variant === 'active' && (
                        <div className='flex items-center gap-2'>
                          <div className='h-2 w-20 overflow-hidden rounded-full bg-muted'>
                            <div
                              className='h-full bg-primary transition-all'
                              style={{ width: `${task.progress ?? 0}%` }}
                            />
                          </div>
                          <span className='text-muted-foreground text-xs'>{task.progress ?? 0}%</span>
                        </div>
                      )}
                      {variant === 'failed' && (
                        <div className='flex items-center gap-2'>
                          <AlertCircle className='h-4 w-4 flex-shrink-0 text-destructive' />
                          {task.failedReason ? (
                            <button
                              type='button'
                              onClick={() => handleViewDetails(task)}
                              className='max-w-[200px] cursor-pointer text-left text-destructive text-xs hover:underline'
                              title='Click to view full error'
                            >
                              {task.failedReason.length > 40
                                ? `${task.failedReason.slice(0, 40)}...`
                                : task.failedReason}
                            </button>
                          ) : (
                            <span className='text-muted-foreground text-xs'>No error details</span>
                          )}
                        </div>
                      )}
                    </td>
                    {variant === 'failed' && (
                      <td className='py-3'>
                        <div className='flex items-center gap-2'>
                          <button
                            type='button'
                            onClick={() => handleViewDetails(task)}
                            className='flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium text-xs transition-colors hover:bg-accent'
                            title='View task details'
                          >
                            <Eye className='h-3 w-3' />
                            Details
                          </button>
                          {onRetryTask && (
                            <button
                              type='button'
                              onClick={() => handleRetryClick(task)}
                              className='flex items-center gap-1.5 rounded-md border px-2 py-1 font-medium text-xs transition-colors hover:bg-accent'
                              title='Retry this task'
                            >
                              <RotateCcw className='h-3 w-3' />
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {tasks.length > 20 && (
              <div className='mt-3 text-center text-muted-foreground text-sm'>Showing 20 of {tasks.length} tasks</div>
            )}
          </div>
        )}

        {/* Retry Confirmation Dialog */}
        <Dialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
          <DialogContent onClose={() => setRetryDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle>Retry Failed Task</DialogTitle>
              <DialogDescription>Are you sure you want to retry this task?</DialogDescription>
            </DialogHeader>

            {selectedTask && (
              <div className='my-4 rounded-lg border bg-muted/50 p-3 text-sm'>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='text-muted-foreground'>Task ID:</div>
                  <div className='font-mono'>{selectedTask.id?.slice(0, 12)}</div>
                  <div className='text-muted-foreground'>Organization:</div>
                  <div>{selectedTask.data?.orgId ?? '-'}</div>
                  <div className='text-muted-foreground'>Type:</div>
                  <div>{selectedTask.data?.type ?? selectedTask.name}</div>
                  {selectedTask.failedReason && (
                    <>
                      <div className='text-muted-foreground'>Error:</div>
                      <div className='text-destructive text-xs'>{selectedTask.failedReason.slice(0, 50)}...</div>
                    </>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <button
                type='button'
                onClick={() => setRetryDialogOpen(false)}
                disabled={isRetrying}
                className='rounded-md border px-4 py-2 font-medium text-sm transition-colors hover:bg-accent disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleConfirmRetry}
                disabled={isRetrying}
                className='rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-50'
              >
                {isRetrying ? 'Retrying...' : 'Retry Task'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent onClose={() => setDetailsDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5 text-destructive' />
                Failed Task Details
              </DialogTitle>
              <DialogDescription>View complete information about the failed task</DialogDescription>
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
                    <div className='text-muted-foreground'>Created:</div>
                    <div>{formatTime(selectedTask.timestamp)}</div>
                    {selectedTask.processedOn && (
                      <>
                        <div className='text-muted-foreground'>Started:</div>
                        <div>{formatTime(selectedTask.processedOn)}</div>
                      </>
                    )}
                    {selectedTask.finishedOn && (
                      <>
                        <div className='text-muted-foreground'>Failed at:</div>
                        <div>{formatTime(selectedTask.finishedOn)}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Error Details */}
                <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3'>
                  <h4 className='mb-2 flex items-center gap-2 font-medium text-destructive'>
                    <AlertCircle className='h-4 w-4' />
                    Error Message
                  </h4>
                  <div className='max-h-[200px] overflow-y-auto whitespace-pre-wrap break-all rounded bg-destructive/10 p-3 font-mono text-xs'>
                    {selectedTask.failedReason || 'No error message available'}
                  </div>
                </div>

                {/* Payload Info */}
                {selectedTask.data?.payload && Object.keys(selectedTask.data.payload).length > 0 && (
                  <div className='rounded-lg border bg-muted/50 p-3'>
                    <h4 className='mb-2 font-medium text-sm'>Task Payload</h4>
                    <pre className='max-h-[150px] overflow-x-auto overflow-y-auto rounded bg-background p-2 text-xs'>
                      {JSON.stringify(selectedTask.data.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <button
                type='button'
                onClick={() => setDetailsDialogOpen(false)}
                className='rounded-md border px-4 py-2 font-medium text-sm transition-colors hover:bg-accent'
              >
                Close
              </button>
              {onRetryTask && (
                <button
                  type='button'
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    setRetryDialogOpen(true);
                  }}
                  className='rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90'
                >
                  <RotateCcw className='mr-1.5 inline h-4 w-4' />
                  Retry Task
                </button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
