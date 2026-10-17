import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { QueueStats } from '@/lib/types';

interface WorkloadChartProps {
  stats: QueueStats | undefined;
  isLoading: boolean;
}

const chartConfig = {
  count: {
    label: 'Jobs'
  },
  active: {
    label: 'Active',
    color: 'hsl(217 91% 60%)'
  },
  waiting: {
    label: 'Waiting',
    color: 'hsl(45 93% 47%)'
  },
  completed: {
    label: 'Completed',
    color: 'hsl(142 76% 36%)'
  },
  failed: {
    label: 'Failed',
    color: 'hsl(0 84% 60%)'
  },
  delayed: {
    label: 'Delayed',
    color: 'hsl(270 70% 60%)'
  }
} satisfies ChartConfig;

export function WorkloadChart({ stats, isLoading }: WorkloadChartProps) {
  // Combine waiting + prioritized since both are jobs pending to be processed
  const pendingCount = (stats?.waiting ?? 0) + (stats?.prioritized ?? 0);

  const data = stats
    ? [
        { status: 'Active', count: stats.active, fill: 'var(--color-active)' },
        { status: 'Waiting', count: pendingCount, fill: 'var(--color-waiting)' },
        { status: 'Completed', count: stats.completed, fill: 'var(--color-completed)' },
        { status: 'Failed', count: stats.failed, fill: 'var(--color-failed)' },
        { status: 'Delayed', count: stats.delayed, fill: 'var(--color-delayed)' }
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workload Overview</CardTitle>
        <CardDescription>Current queue status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-[300px] items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='h-[300px] w-full'>
            <BarChart data={data} layout='vertical' margin={{ left: 20 }}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey='status' type='category' tickLine={false} axisLine={false} width={80} />
              <XAxis type='number' hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey='count' radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
