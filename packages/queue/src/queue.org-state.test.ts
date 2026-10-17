import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseOrgPriority } from './queue.org-state.js';

describe('parseOrgPriority', () => {
  it('accepts 1, 2 and 3 as numbers or strings', () => {
    assert.equal(parseOrgPriority(1), 1);
    assert.equal(parseOrgPriority('3'), 3);
  });

  it('rejects anything else', () => {
    for (const value of [0, 4, 'high', null, undefined, 1.5]) {
      assert.equal(parseOrgPriority(value), null);
    }
  });
});
