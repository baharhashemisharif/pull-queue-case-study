export type TimeFormat = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

export interface ToSecondsParams {
  amount: number;
  format: TimeFormat;
}

const SECONDS_PER_UNIT: Record<TimeFormat, number> = {
  seconds: 1,
  minutes: 60,
  hours: 60 * 60,
  days: 24 * 60 * 60,
  weeks: 7 * 24 * 60 * 60,
  months: 30 * 24 * 60 * 60 // Approximation: 30 days
};

export function toSeconds({ amount, format }: ToSecondsParams): number {
  return amount * SECONDS_PER_UNIT[format];
}
