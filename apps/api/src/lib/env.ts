import { z } from 'zod';

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  TOSS_APP_KEY: z.string().optional().default(''),
  TOSS_IAP_VERIFY_URL: z.string().url().optional().default('https://apps-in-toss.toss.im/iap/v1/verify'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

let cached: z.infer<typeof EnvSchema> | null = null;

export function getEnv() {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
