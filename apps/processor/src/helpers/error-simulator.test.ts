import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SIMULATED_FAILURE_RATE, SIMULATED_RATE_LIMIT_RATE, simulateRandomError } from './error-simulator.js';
import { ProcessingError, RateLimitError } from './errors.js';

describe('simulateRandomError', () => {
  it('throws a rate-limit error below the rate-limit threshold', () => {
    assert.throws(() => simulateRandomError('meta-ads', () => SIMULATED_RATE_LIMIT_RATE / 2), RateLimitError);
  });

  it('throws a processing error in the failure band', () => {
    const roll = SIMULATED_RATE_LIMIT_RATE + SIMULATED_FAILURE_RATE / 2;
    assert.throws(() => simulateRandomError('meta-ads', () => roll), ProcessingError);
  });

  it('succeeds above both thresholds', () => {
    assert.doesNotThrow(() => simulateRandomError('meta-ads', () => 0.99));
  });
});
