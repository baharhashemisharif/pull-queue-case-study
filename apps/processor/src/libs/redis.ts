import { createRedisClient } from '@repo/shared';
import { env } from './env.js';

export const redis = createRedisClient(env.REDIS_URL);
