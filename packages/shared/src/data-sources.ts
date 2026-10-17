/**
 * Third-party APIs the demo tasks pretend to sync from.
 * Each one has its own rate limits, which is what makes per-provider pausing necessary.
 */
export const DATA_SOURCES = [
  'google-ads',
  'meta-ads',
  'tiktok-ads',
  'linkedin-ads',
  'microsoft-ads',
  'google-analytics'
] as const;

export type DataSource = (typeof DATA_SOURCES)[number];

export function isDataSource(value: unknown): value is DataSource {
  return DATA_SOURCES.some((source) => source === value);
}

export function getAllDataSources(): readonly DataSource[] {
  return DATA_SOURCES;
}

/**
 * Pick a random element from a non-empty list.
 */
export function pickRandom<T>(items: readonly [T, ...T[]]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

export function getRandomDataSource(): DataSource {
  return pickRandom(DATA_SOURCES);
}
