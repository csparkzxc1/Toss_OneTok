import { jsonError } from '@/lib/http.js';
import { getSupabaseAdmin } from '@/lib/supabase.js';
import { todayKstYmd } from '@/lib/words.js';
import type { CategoryId, DailyTodayResponse } from '@choseong-run/shared';
import { CATEGORIES } from '@choseong-run/words';
// GET /api/daily/today?deviceId=...
// 오늘의 일일 챌린지 메타: 카테고리 + 이미 플레이했는지 + 부활 가능 여부
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deviceId = url.searchParams.get('deviceId');
  if (!deviceId) {
    return jsonError('invalid_input', 'deviceId is required', 400);
  }

  const date = todayKstYmd();
  const sb = getSupabaseAdmin();

  // 챌린지 카테고리: daily_challenge 테이블에 있으면 그 값, 없으면 결정적 선택
  const { data: challenge } = await sb
    .from('daily_challenge')
    .select('category')
    .eq('date', date)
    .maybeSingle();

  const category: CategoryId = (challenge?.category as CategoryId | undefined) ?? pickFallback();

  const { data: attempt } = await sb
    .from('daily_attempts')
    .select('attempts')
    .eq('date', date)
    .eq('device_id', deviceId)
    .maybeSingle();
  const attempts = (attempt?.attempts as number | undefined) ?? 0;

  const response: DailyTodayResponse = {
    date,
    category,
    played: attempts >= 1,
    reviveAvailable: attempts < 2, // 광고 부활 1회 허용 → 총 2회까지
  };
  return NextResponse.json(response);
}

function pickFallback(): CategoryId {
  const free = CATEGORIES.filter((c) => !c.premium);
  if (free.length === 0) return 'food';
  const today = new Date();
  const seed = today.getUTCFullYear() * 1000 + today.getUTCMonth() * 50 + today.getUTCDate();
  const idx = seed % free.length;
  return free[idx]?.id ?? 'food';
}
