import { Activity, CheckCircle, Clock, Timer, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { QueueStats } from '@/lib/types';

interface StatsCardsProps {
  stats: QueueStats | undefined;
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  // Combine waiting + prioritized since both are jobs pending to be processed
  // Jobs with priority go into "prioritized" bucket in BullMQ
  const pendingCount = (stats?.waiting ?? 0) + (stats?.prioritized ?? 0);

  const cards = [
    {
      title: 'Active',
      value: stats?.active ?? 0,
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Waiting',
      value: pendingCount,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Completed',
      value: stats?.completed ?? 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Failed',
      value: stats?.failed ?? 0,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Delayed',
      value: stats?.delayed ?? 0,
      icon: Timer,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='font-medium text-sm'>{card.title}</CardTitle>
            <div className={`rounded-full p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='h-8 w-16 animate-pulse rounded bg-muted' />
            ) : (
              <div className='font-bold text-2xl'>{card.value.toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
