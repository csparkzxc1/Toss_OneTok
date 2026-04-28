import { NextResponse } from 'next/server';
import { BonusRequestSchema } from '@hanjul-tok/shared';
import { jsonError } from '@/lib/http.js';
import { getUsage, grantBonus } from '@/lib/ratelimit.js';
import { getSubscriptionStatus } from '@/lib/subscription.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deviceId = url.searchParams.get('deviceId');
  const userId = url.searchParams.get('userId');
  if (!deviceId) {
    return jsonError('invalid_input', 'deviceId is required', 400);
  }

  const sub = await getSubscriptionStatus(userId);
  if (sub.isPremium) {
    return NextResponse.json({
      remaining: 9999,
      bonusRemaining: 0,
      isPremium: true,
      resetAt: sub.expiresAt ?? new Date().toISOString(),
    });
  }

  const usage = await getUsage(deviceId, !!userId);
  return NextResponse.json({
    remaining: usage.remaining,
    bonusRemaining: usage.bonusRemaining,
    isPremium: false,
    resetAt: usage.resetAt,
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_input', '잘못된 요청입니다.', 400);
  }
  const parsed = BonusRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', '입력값이 올바르지 않습니다.', 400);
  }

  // TODO(toss): 실제 통합 시 광고 토큰을 토스 SDK로 검증해야 함.
  // 현재는 토큰 존재만 검사하고, 일일 보너스 상한은 서버에서 강제한다.
  if (parsed.data.adToken.length < 8) {
    return jsonError('invalid_input', '광고 토큰이 유효하지 않습니다.', 400);
  }

  const result = await grantBonus(parsed.data.deviceId);
  if (!result.ok) {
    return jsonError('rate_limit', '오늘 광고 보상은 모두 받으셨어요.', 429);
  }

  return NextResponse.json({ ok: true, bonusEarned: result.bonusEarned });
}
