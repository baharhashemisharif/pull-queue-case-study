import { createLogger as createBaseLogger, type LogLevel } from '@repo/logger';
import { env } from './env.js';

const minLevel: LogLevel = env.NODE_ENV === 'production' ? 'info' : 'debug';

/**
 * Create a logger with the given context name.
 * Log level is determined by NODE_ENV (debug in development, info in production).
 */
export function createLogger(context: string) {
  return createBaseLogger(context, { minLevel });
}
