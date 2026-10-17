import type { Redis } from 'ioredis';
import type { OrgPriority, OrgQueueState } from './queue.types.js';

const ORG_STATE_PREFIX = 'org:state:';

export function parseOrgPriority(value: unknown): OrgPriority | null {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 ? n : null;
}

/**
 * Per-organisation queue settings, stored in Redis so the API can change them
 * at runtime. Priority is read when a task is enqueued, so a change applies to
 * new tasks only.
 */
export class OrgStateManager {
  constructor(
    private redis: Redis,
    private defaultPriority: OrgPriority
  ) {}

  private key(orgId: string): string {
    return `${ORG_STATE_PREFIX}${orgId}`;
  }

  async getOrgState(orgId: string): Promise<OrgQueueState> {
    const stored = await this.redis.hget(this.key(orgId), 'priority');
    return { priority: parseOrgPriority(stored) ?? this.defaultPriority };
  }

  async setOrgPriority(orgId: string, priority: OrgPriority): Promise<void> {
    await this.redis.hset(this.key(orgId), 'priority', String(priority));
  }
}
