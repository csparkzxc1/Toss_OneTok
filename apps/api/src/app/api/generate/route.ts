import { NextResponse } from 'next/server';
import { GenerateRequestSchema, FREE_TONES, PREMIUM_TONES } from '@hanjul-tok/shared';
import { generateMessages } from '@/lib/anthropic.js';
import { getClientIp, jsonError } from '@/lib/http.js';
import { consumeUsage, getIpLimiter } from '@/lib/ratelimit.js';
import { getSubscriptionStatus } from '@/lib/subscription.js';
import { getSupabaseAdmin } from '@/lib/supabase.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_input', '요청 본문이 올바른 JSON이 아닙니다.', 400);
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', '입력값이 올바르지 않습니다.', 400);
  }
  const input = parsed.data;

  const ip = getClientIp(req);
  const rl = await getIpLimiter().limit(`${ip}:${input.deviceId}`);
  if (!rl.success) {
    return jsonError('rate_limit', '너무 빠르게 요청하셨어요. 잠시 후 다시 시도해주세요.', 429);
  }

  const sub = await getSubscriptionStatus(input.userId);
  const isPremiumTone = (PREMIUM_TONES as readonly string[]).includes(input.tone);
  if (isPremiumTone && !sub.isPremium) {
    return jsonError('premium_required', '이 톤은 프리미엄 구독 후 사용할 수 있어요.', 402);
  }

  let remaining = Number.POSITIVE_INFINITY;
  if (!sub.isPremium) {
    const consumption = await consumeUsage(input.deviceId, input.userId !== null);
    if (!consumption.ok) {
      return jsonError('usage_exhausted', '오늘 무료 사용량을 모두 썼어요.', 402);
    }
    remaining = consumption.remaining;
  }

  let result: { candidates: [string, string, string] };
  try {
    result = await generateMessages({
      situation: input.situation,
      tone: input.tone,
      context: input.context,
    });
  } catch (err) {
    console.error('[generate]', err);
    return jsonError('server_error', '메시지 생성에 실패했어요. 다시 시도해주세요.', 500);
  }

  // Persist (best-effort, do not block response on error)
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('generations').insert({
      user_id: input.userId,
      device_id: input.deviceId,
      situation: input.situation,
      tone: input.tone,
      context: `len:${input.context.length}`, // 평문 저장 금지: 길이만 기록
      candidates: result.candidates,
    });
  } catch (err) {
    console.error('[generate.persist]', err);
  }

  return NextResponse.json({
    candidates: result.candidates,
    remainingFreeUses: Number.isFinite(remaining) ? remaining : 9999,
    isPremium: sub.isPremium,
  });
}

// Avoid lint warning when only POST defined
void FREE_TONES;
