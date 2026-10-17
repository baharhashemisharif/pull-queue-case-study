import type { AddTaskParams, TaskType } from '@repo/queue';
import { getRandomDataSource, pickRandom } from '@repo/shared';

/** Fictional organisations used when generating demo load. */
export const TEST_ORGS = ['acme-corp', 'globex-inc', 'initech-llc', 'umbrella-co', 'stark-industries'] as const;

export function getRandomTestOrg(): string {
  return pickRandom(TEST_ORGS);
}

export function generateTestTasks(count: number, options: { orgId?: string; type?: TaskType } = {}): AddTaskParams[] {
  const { orgId, type = 'fetch' } = options;

  return Array.from({ length: count }, (_, i) => ({
    orgId: orgId ?? getRandomTestOrg(),
    type,
    connectorId: `test-connector-${i + 1}`,
    payload: {
      testIndex: i + 1,
      dataSource: getRandomDataSource(),
      generatedAt: new Date().toISOString()
    }
  }));
}
