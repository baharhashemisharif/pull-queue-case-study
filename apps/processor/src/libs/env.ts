import { z } from 'zod';

const envSchema = z.object({
  REDIS_URL: z.url(),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(20),
  SIMULATED_WORK_MS: z.coerce.number().int().nonnegative().default(2000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.issues, null, 2));
  process.exit(1);
}

export const env = parsed.data;
