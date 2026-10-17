import { AlertTriangle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RateLimitedPlatform } from '@/lib/types';

interface RateLimitedPlatformsProps {
  platforms: RateLimitedPlatform[];
  isLoading: boolean;
}

function formatTimeRemaining(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
}

function formatPlatformName(platform: string): string {
  return platform
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function RateLimitedPlatforms({ platforms, isLoading }: RateLimitedPlatformsProps) {
  return (
    <Card className={platforms.length > 0 ? 'border-orange-500/50' : ''}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div>
          <CardTitle className='flex items-center gap-2'>
            Rate-Limited Platforms
            {platforms.length > 0 && (
              <Badge variant='destructive' className='ml-2'>
                {platforms.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Platforms currently paused due to rate limiting</CardDescription>
        </div>
        <div className={`rounded-full p-2 ${platforms.length > 0 ? 'bg-orange-500/10' : 'bg-muted'}`}>
          <AlertTriangle className={`h-5 w-5 ${platforms.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-[120px] items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent' />
          </div>
        ) : platforms.length === 0 ? (
          <div className='flex h-[120px] flex-col items-center justify-center text-muted-foreground'>
            <Clock className='mb-2 h-8 w-8 opacity-50' />
            <p>No rate-limited platforms</p>
            <p className='text-xs'>All platforms are operating normally</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {platforms.map((platform) => (
              <div
                key={platform.platform}
                className='flex items-center justify-between rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3'
              >
                <div className='flex items-center gap-3'>
                  <div className='h-2 w-2 animate-pulse rounded-full bg-orange-500' />
                  <div>
                    <p className='font-medium'>{formatPlatformName(platform.platform)}</p>
                    <p className='text-muted-foreground text-xs'>
                      Resumes at {new Date(platform.resetAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-orange-500' />
                  <span className='font-mono font-semibold text-orange-500 text-sm'>
                    {formatTimeRemaining(platform.remainingMinutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
