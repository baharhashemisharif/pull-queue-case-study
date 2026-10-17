import { ProcessingError, RateLimitError } from './errors.js';

export const SIMULATED_RATE_LIMIT_RATE = 0.01;
export const SIMULATED_FAILURE_RATE = 0.1;

/**
 * Stand-in for a real API call: randomly fails so the retry and rate-limit
 * paths get exercised. `random` is injectable for tests.
 */
export function simulateRandomError(dataSource: string, random: () => number = Math.random): void {
  const roll = random();

  if (roll < SIMULATED_RATE_LIMIT_RATE) {
    // Half the time the provider tells us how long to wait, half the time it doesn't.
    const retryAfterMs = random() < 0.5 ? (Math.floor(random() * 5) + 1) * 60_000 : undefined;
    throw new RateLimitError(dataSource, retryAfterMs);
  }

  if (roll < SIMULATED_RATE_LIMIT_RATE + SIMULATED_FAILURE_RATE) {
    throw new ProcessingError(`Simulated processing error for ${dataSource}`);
  }
}
