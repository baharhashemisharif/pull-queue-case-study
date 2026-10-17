import { Calendar, X } from 'lucide-react';
import type { DateRange } from '@/lib/types';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDateRangeChange({
      ...dateRange,
      from: value ? new Date(value + 'T00:00:00') : null
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDateRangeChange({
      ...dateRange,
      to: value ? new Date(value + 'T23:59:59') : null
    });
  };

  const handleClear = () => {
    onDateRangeChange({ from: null, to: null });
  };

  const hasFilter = dateRange.from || dateRange.to;

  // Quick filter presets
  const applyPreset = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (preset) {
      case 'today':
        onDateRangeChange({
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        });
        break;
      case 'yesterday': {
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        onDateRangeChange({
          from: yesterday,
          to: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        });
        break;
      }
      case 'last7days':
        onDateRangeChange({
          from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        });
        break;
      case 'last30days':
        onDateRangeChange({
          from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        });
        break;
      case 'thisMonth':
        onDateRangeChange({
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        });
        break;
      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        onDateRangeChange({
          from: lastMonth,
          to: lastMonthEnd
        });
        break;
      }
    }
  };

  return (
    <div className='flex flex-col gap-3'>
      {/* Date inputs row */}
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4 text-muted-foreground' />
          <span className='font-medium text-sm'>Date Range:</span>
        </div>

        <div className='flex items-center gap-2'>
          <input
            type='date'
            value={formatDateForInput(dateRange.from)}
            onChange={handleFromChange}
            className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring'
            placeholder='From'
          />
          <span className='text-muted-foreground'>to</span>
          <input
            type='date'
            value={formatDateForInput(dateRange.to)}
            onChange={handleToChange}
            className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring'
            placeholder='To'
          />
        </div>

        {hasFilter && (
          <button
            type='button'
            onClick={handleClear}
            className='flex items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground'
          >
            <X className='h-4 w-4' />
            Clear
          </button>
        )}
      </div>

      {/* Quick presets */}
      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-muted-foreground text-xs'>Quick:</span>
        {[
          { id: 'today', label: 'Today' },
          { id: 'yesterday', label: 'Yesterday' },
          { id: 'last7days', label: 'Last 7 days' },
          { id: 'last30days', label: 'Last 30 days' },
          { id: 'thisMonth', label: 'This month' },
          { id: 'lastMonth', label: 'Last month' }
        ].map((preset) => (
          <button
            type='button'
            key={preset.id}
            onClick={() => applyPreset(preset.id)}
            className='rounded-md border border-input bg-background px-2 py-1 text-xs transition-colors hover:bg-accent'
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
