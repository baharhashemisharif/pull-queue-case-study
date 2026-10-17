import type { Redis } from 'ioredis';
import { type DataSource, isDataSource } from './data-sources.js';

/**
 * How long to pause a provider after it returns a rate-limit error, when the
 * provider does not say how long to wait. Values are illustrative.
 */
export const RATE_LIMIT_PAUSE_MINUTES: Record<DataSource, number> = {
  'google-ads': 1,
  'meta-ads': 1,
  'tiktok-ads': 1,
  'linkedin-ads': 5,
  'microsoft-ads': 10,
  'google-analytics': 1
};

export const DEFAULT_RATE_LIMIT_PAUSE_MINUTES = 5;

export const RATE_LIMIT_KEY_PREFIX = 'ratelimit:';

export function getRateLimitPauseMs(dataSource: string): number {
  const minutes = isDataSource(dataSource) ? RATE_LIMIT_PAUSE_MINUTES[dataSource] : DEFAULT_RATE_LIMIT_PAUSE_MINUTES;
  return minutes * 60_000;
}

export interface RateLimitInfo {
  platform: string;
  resetAt: number;
  resetAtISO: string;
  remainingMinutes: number;
}

export function formatRateLimitInfo(platform: string, resetAt: number, now = Date.now()): RateLimitInfo {
  return {
    platform,
    resetAt,
    resetAtISO: new Date(resetAt).toISOString(),
    remainingMinutes: Math.ceil(Math.max(0, resetAt - now) / 60_000)
  };
}

/**
 * The part of the store the worker needs. Kept as an interface so the task
 * processor can be unit-tested with an in-memory fake.
 */
export interface RateLimitReader {
  getResetAt(dataSource: string): Promise<number | null>;
  pause(dataSource: string, durationMs: number): Promise<number>;
}

/**
 * Per-provider pause flags shared by every worker through Redis.
 *
 * Each flag is a key holding the reset timestamp, with a matching TTL, so it
 * clears itself when the pause is over.
 */
export class RateLimitStore implements RateLimitReader {
  constructor(private redis: Redis) {}

  private key(dataSource: string): string {
    return `${RATE_LIMIT_KEY_PREFIX}${dataSource}`;
  }

  /**
   * Pause a provider. If it is already paused, the existing window is kept
   * rather than extended, so a burst of failing jobs cannot push the reset
   * time forward indefinitely. Returns the effective reset time.
   */
  async pause(dataSource: string, durationMs: number): Promise<number> {
    const resetAt = Date.now() + durationMs;
    const created = await this.redis.set(this.key(dataSource), String(resetAt), 'PX', durationMs, 'NX');
    if (created) return resetAt;
    return (await this.getResetAt(dataSource)) ?? resetAt;
  }

  async getResetAt(dataSource: string): Promise<number | null> {
    const value = await this.redis.get(this.key(dataSource));
    return value ? Number(value) : null;
  }

  /**
   * List paused providers. Uses SCAN rather than KEYS so it never blocks Redis.
   */
  async list(): Promise<RateLimitInfo[]> {
    const keys = await this.scanKeys();
    if (keys.length === 0) return [];

    const values = await this.redis.mget(...keys);
    const now = Date.now();

    return keys
      .map((key, i) => ({ platform: key.slice(RATE_LIMIT_KEY_PREFIX.length), resetAt: Number(values[i]) }))
      .filter(({ resetAt }) => resetAt > now)
      .map(({ platform, resetAt }) => formatRateLimitInfo(platform, resetAt, now))
      .sort((a, b) => a.resetAt - b.resetAt);
  }

  async clear(): Promise<number> {
    const keys = await this.scanKeys();
    if (keys.length > 0) await this.redis.del(...keys);
    return keys.length;
  }

  private async scanKeys(): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.redis.scan(cursor, 'MATCH', `${RATE_LIMIT_KEY_PREFIX}*`, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }
}
