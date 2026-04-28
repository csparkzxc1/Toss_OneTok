import { Ratelimit } from '@upstash/ratelimit';
import {
  BONUS_DAILY_LIMIT,
  FREE_DAILY_LIMIT_ANON,
  FREE_DAILY_LIMIT_LOGGED_IN,
} from '@hanjul-tok/shared';
import { getRedis } from './redis.js';

let ipLimiter: Ratelimit | null = null;

export function getIpLimiter() {
  if (ipLimiter) return ipLimiter;
  ipLimiter = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: false,
    prefix: 'rl:ip',
  });
  return ipLimiter;
}

function todayKey(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const SECONDS_IN_DAY = 60 * 60 * 24;

export interface UsageState {
  used: number;
  bonusEarned: number;
  remaining: number;
  bonusRemaining: number;
  resetAt: string;
}

function dailyLimit(isLoggedIn: boolean): number {
  return isLoggedIn ? FREE_DAILY_LIMIT_LOGGED_IN : FREE_DAILY_LIMIT_ANON;
}

function endOfDayUtcIso(): string {
  const now = new Date();
  const eod = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );
  return eod.toISOString();
}

export async function getUsage(deviceId: string, isLoggedIn: boolean): Promise<UsageState> {
  const redis = getRedis();
  const day = todayKey();
  const usedKey = `usage:${deviceId}:${day}`;
  const bonusKey = `bonus:${deviceId}:${day}`;

  const [used, bonusEarned] = await Promise.all([
    redis.get<number>(usedKey),
    redis.get<number>(bonusKey),
  ]);

  const usedNum = used ?? 0;
  const bonusNum = bonusEarned ?? 0;
  const limit = dailyLimit(isLoggedIn);
  const totalAllowed = limit + bonusNum;
  const remaining = Math.max(0, totalAllowed - usedNum);
  const bonusRemaining = Math.max(0, BONUS_DAILY_LIMIT - bonusNum);

  return {
    used: usedNum,
    bonusEarned: bonusNum,
    remaining,
    bonusRemaining,
    resetAt: endOfDayUtcIso(),
  };
}

export async function consumeUsage(
  deviceId: string,
  isLoggedIn: boolean,
): Promise<{ ok: boolean; remaining: number }> {
  const redis = getRedis();
  const day = todayKey();
  const usedKey = `usage:${deviceId}:${day}`;
  const bonusKey = `bonus:${deviceId}:${day}`;

  const [used, bonusEarned] = await Promise.all([
    redis.get<number>(usedKey),
    redis.get<number>(bonusKey),
  ]);
  const limit = dailyLimit(isLoggedIn);
  const totalAllowed = limit + (bonusEarned ?? 0);

  if ((used ?? 0) >= totalAllowed) {
    return { ok: false, remaining: 0 };
  }

  const next = await redis.incr(usedKey);
  if (next === 1) {
    await redis.expire(usedKey, SECONDS_IN_DAY);
  }

  return { ok: true, remaining: Math.max(0, totalAllowed - next) };
}

export async function grantBonus(deviceId: string): Promise<{ ok: boolean; bonusEarned: number }> {
  const redis = getRedis();
  const day = todayKey();
  const bonusKey = `bonus:${deviceId}:${day}`;

  const current = (await redis.get<number>(bonusKey)) ?? 0;
  if (current >= BONUS_DAILY_LIMIT) {
    return { ok: false, bonusEarned: current };
  }
  const next = await redis.incr(bonusKey);
  if (next === 1) {
    await redis.expire(bonusKey, SECONDS_IN_DAY);
  }
  return { ok: true, bonusEarned: next };
}
