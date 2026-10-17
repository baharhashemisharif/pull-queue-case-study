/**
 * A provider told us to slow down. `retryAfterMs` is set when the provider
 * says how long to wait (e.g. a Retry-After header).
 */
export class RateLimitError extends Error {
  constructor(
    public dataSource: string,
    public retryAfterMs?: number
  ) {
    super(`Rate limit exceeded for ${dataSource}`);
    this.name = 'RateLimitError';
  }
}

/** Any other failure. These go through BullMQ's normal retry/backoff. */
export class ProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProcessingError';
  }
}
