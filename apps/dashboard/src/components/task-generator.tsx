import { Loader2, Zap } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateTasks } from '@/lib/api';

interface TaskGeneratorProps {
  onGenerate?: () => void;
}

export function TaskGenerator({ onGenerate }: TaskGeneratorProps) {
  const [count, setCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{ count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setLastResult(null);

    try {
      setLastResult(await generateTasks(count));
      onGenerate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2'>
          <Zap className='h-5 w-5 text-yellow-500' />
          Task Generator
        </CardTitle>
        <CardDescription>Generate random test tasks with randomized data sources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-end gap-3'>
          <div className='flex-1'>
            <label htmlFor='task-count' className='mb-1.5 block font-medium text-sm'>
              Number of tasks
            </label>
            <input
              id='task-count'
              type='number'
              min={1}
              max={10000}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10000, Number.parseInt(e.target.value, 10) || 1)))}
              className='w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              placeholder='10'
            />
          </div>
          <button
            type='button'
            onClick={handleGenerate}
            disabled={isLoading}
            className='inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                Generating...
              </>
            ) : (
              <>
                <Zap className='h-4 w-4' />
                Generate Tasks
              </>
            )}
          </button>
        </div>

        {/* Quick presets */}
        <div className='mt-3 flex gap-2'>
          <span className='text-muted-foreground text-xs'>Quick:</span>
          {[10, 50, 100, 500].map((preset) => (
            <button
              type='button'
              key={preset}
              onClick={() => setCount(preset)}
              className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                count === preset ? 'border-primary bg-primary/10 text-primary' : 'border-transparent hover:bg-muted'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Result feedback */}
        {lastResult && (
          <div className='mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3'>
            <p className='font-medium text-green-600 text-sm'>✓ Generated {lastResult.count} tasks successfully</p>
          </div>
        )}

        {error && (
          <div className='mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3'>
            <p className='font-medium text-red-600 text-sm'>✗ {error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
