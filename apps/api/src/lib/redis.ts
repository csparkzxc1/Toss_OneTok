import { Redis } from '@upstash/redis';
import { getEnv } from './env.js';

let client: Redis | null = null;

export function getRedis() {
  if (client) return client;
  const env = getEnv();
  client = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
  return client;
}
