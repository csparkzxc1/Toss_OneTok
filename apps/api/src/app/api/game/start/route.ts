import { getClientIp, jsonError } from '@/lib/http.js';
import { consumeUsage, getIpLimiter, getUsage } from '@/lib/ratelimit.js';
import { newSessionId, saveSession } from '@/lib/session.js';
import { getSubscriptionStatus } from '@/lib/subscription.js';
import { getRandomFreeCategory, getWordPool, selectWordsForGame } from '@/lib/words.js';
import {
  type CategoryId,
  GameStartRequestSchema,
  type GameStartResponse,
  type GameWordPublic,
  WORDS_PER_GAME,
} from '@choseong-run/shared';
import { CATEGORIES } from '@choseong-run/words';
// POST /api/game/start
// - 사용량 검증 → 단어 풀에서 30개 추출 → 정답을 클라에 보내지 않고 초성+힌트만 전달.
// - 정답은 Redis 세션에 보관, submit 시 채점.
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PREMIUM_CATEGORIES: ReadonlySet<CategoryId> = new Set(
  CATEGORIES.filter((c) => c.premium).map((c) => c.id),
);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_input', '잘못된 요청입니다.', 400);
  }
  const parsed = GameStartRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', '입력값이 올바르지 않습니다.', 400);
  }
  const { deviceId, userId, mode } = parsed.data;

  // IP rate limit (분당 10회)
  const ip = getClientIp(req);
  const limited = await getIpLimiter().limit(`start:${ip}`);
  if (!limited.success) {
    return jsonError('rate_limit', '요청이 너무 빨라요. 잠시 후 다시 시도해주세요.', 429);
  }

  const sub = await getSubscriptionStatus(userId);

  // 카테고리 결정 + 프리미엄 체크
  let category: CategoryId;
  if (mode === 'daily') {
    category = await pickDailyCategory();
  } else {
    category = parsed.data.category ?? getRandomFreeCategory();
    if (PREMIUM_CATEGORIES.has(category) && !sub.isPremium) {
      return jsonError('premium_required', '프리미엄 전용 카테고리예요.', 402);
    }
  }

  // 사용량 차감 (프리미엄은 패스, 일일 챌린지는 별도 흐름이지만 여기서는 normal과 동일 처리 + 별도 attempt)
  let remaining = 9999;
  if (!sub.isPremium) {
    const consumed = await consumeUsage(deviceId, !!userId);
    if (!consumed.ok) {
      return jsonError(
        'usage_exhausted',
        '오늘 무료 게임을 모두 사용했어요. 광고를 보거나 프리미엄을 이용해보세요.',
        402,
      );
    }
    remaining = consumed.remaining;
  } else {
    const usage = await getUsage(deviceId, !!userId);
    remaining = usage.remaining; // 표시용 (사실상 무한)
  }

  // 단어 풀 가져오기 + 랜덤 30개 선택
  const pool = await getWordPool(category);
  if (pool.length === 0) {
    return jsonError('server_error', '단어 풀을 불러오지 못했어요.', 500);
  }

  const { authoritative, publics } = selectWordsForGame(pool, WORDS_PER_GAME);

  // 세션 저장 (정답은 서버만 보관)
  const sessionId = newSessionId();
  const startedAt = new Date().toISOString();
  await saveSession({
    id: sessionId,
    deviceId,
    userId,
    mode,
    category,
    words: authoritative,
    startedAt,
  });

  const response: GameStartResponse = {
    sessionId,
    mode,
    category,
    words: publics as GameWordPublic[],
    remainingFreeUses: remaining,
    isPremium: sub.isPremium,
    startedAt,
  };
  return NextResponse.json(response);
}

// daily 챌린지 카테고리는 daily_challenge 테이블에서 가져오되,
// 없으면 today 날짜 기반으로 결정적 선택 (서버 재시작에도 일관성).
async function pickDailyCategory(): Promise<CategoryId> {
  const free = CATEGORIES.filter((c) => !c.premium);
  if (free.length === 0) return 'food';
  const today = new Date();
  const seed = today.getUTCFullYear() * 1000 + today.getUTCMonth() * 50 + today.getUTCDate();
  const idx = seed % free.length;
  return free[idx]?.id ?? 'food';
}
