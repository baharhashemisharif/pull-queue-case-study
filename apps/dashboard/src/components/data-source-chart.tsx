import { useMemo } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { getTaskDataSource } from '@/lib/api';
import type { Task } from '@/lib/types';

interface DataSourceChartProps {
  tasks: Task[];
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(217 91% 60%)',
  'hsl(45 93% 47%)',
  'hsl(142 76% 36%)'
];

export function DataSourceChart({ tasks, isLoading }: DataSourceChartProps) {
  const { data, chartConfig } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      const source = getTaskDataSource(task) ?? 'unknown';
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }

    const sorted = [...counts]
      .sort((a, b) => b[1] - a[1])
      .map(([source, count], index) => ({ source, count, fill: COLORS[index % COLORS.length] }));

    const config: ChartConfig = Object.fromEntries(
      sorted.map((item) => [item.source, { label: item.source, color: item.fill }])
    );

    return { data: sorted, chartConfig: config };
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Data Source</CardTitle>
        <CardDescription>Pending and active tasks per provider</CardDescription>
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
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey='source' />} />
              <Pie
                data={data}
                dataKey='count'
                nameKey='source'
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.source} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey='source' />}
                className='flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center'
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
