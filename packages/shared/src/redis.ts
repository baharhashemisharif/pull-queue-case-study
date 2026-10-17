import { Redis } from 'ioredis';

/**
 * Create a Redis client instance.
 * @param redisUrl - Redis connection URL
 */
export function createRedisClient(redisUrl: string): Redis {
  return new Redis(redisUrl);
}

export type { Redis };
