import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_RATE_LIMIT_PAUSE_MINUTES, formatRateLimitInfo, getRateLimitPauseMs } from './rate-limit.js';

describe('getRateLimitPauseMs', () => {
  it('uses the per-provider pause for known providers', () => {
    assert.equal(getRateLimitPauseMs('microsoft-ads'), 10 * 60_000);
  });

  it('falls back to the default for unknown providers', () => {
    assert.equal(getRateLimitPauseMs('some-new-api'), DEFAULT_RATE_LIMIT_PAUSE_MINUTES * 60_000);
  });
});

describe('formatRateLimitInfo', () => {
  it('rounds remaining time up to whole minutes', () => {
    const info = formatRateLimitInfo('meta-ads', 90_001, 0);
    assert.equal(info.remainingMinutes, 2);
    assert.equal(info.resetAtISO, new Date(90_001).toISOString());
  });

  it('never reports negative time', () => {
    assert.equal(formatRateLimitInfo('meta-ads', 0, 10_000).remainingMinutes, 0);
  });
});
