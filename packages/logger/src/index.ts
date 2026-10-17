export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

function shouldLog(level: LogLevel, minLevel: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatMessage(level: LogLevel, context: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${level.toUpperCase()}] ${context}: ${message}`;
}

export interface CreateLoggerOptions {
  minLevel?: LogLevel;
}

/**
 * Create a logger with the given context name.
 * @param context - The context name to prefix log messages with
 * @param options - Optional configuration (minLevel defaults to "debug")
 */
export function createLogger(context: string, options: CreateLoggerOptions = {}): Logger {
  const minLevel = options.minLevel ?? 'debug';

  return {
    debug: (message: string, ...args: unknown[]) => {
      if (shouldLog('debug', minLevel)) {
        console.debug(formatMessage('debug', context, message), ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      if (shouldLog('info', minLevel)) {
        console.info(formatMessage('info', context, message), ...args);
      }
    },
    warn: (message: string, ...args: unknown[]) => {
      if (shouldLog('warn', minLevel)) {
        console.warn(formatMessage('warn', context, message), ...args);
      }
    },
    error: (message: string, ...args: unknown[]) => {
      if (shouldLog('error', minLevel)) {
        console.error(formatMessage('error', context, message), ...args);
      }
    }
  };
}

/**
 * A no-op logger that discards all log messages.
 * Useful for testing or when logging should be disabled.
 */
export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {}
};
