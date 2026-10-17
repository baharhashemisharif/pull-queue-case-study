import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { Task } from '@/lib/types';

interface OrgBreakdownChartProps {
  tasks: Task[];
  isLoading: boolean;
}

const chartConfig = {
  count: {
    label: 'Tasks',
    color: 'hsl(var(--chart-1))'
  }
} satisfies ChartConfig;

export function OrgBreakdownChart({ tasks, isLoading }: OrgBreakdownChartProps) {
  const data = useMemo(() => {
    const orgCounts = new Map<string, number>();

    for (const task of tasks) {
      const orgId = task.data?.orgId ?? 'unknown';
      orgCounts.set(orgId, (orgCounts.get(orgId) || 0) + 1);
    }

    return Array.from(orgCounts.entries())
      .map(([orgId, count]) => ({ orgId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 orgs
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Organization</CardTitle>
        <CardDescription>Top organizations by pending task count</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-[300px] items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : data.length === 0 ? (
          <div className='flex h-[300px] items-center justify-center text-muted-foreground'>No pending tasks</div>
        ) : (
          <ChartContainer config={chartConfig} className='h-[300px] w-full'>
            <BarChart data={data} layout='vertical' margin={{ left: 20 }}>
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey='orgId'
                type='category'
                tickLine={false}
                axisLine={false}
                width={100}
                tickFormatter={(value) => (value.length > 12 ? `${value.slice(0, 12)}...` : value)}
              />
              <XAxis type='number' hide />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey='count' fill='var(--color-count)' radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
