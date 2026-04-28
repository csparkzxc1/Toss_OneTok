import { getClientIp, jsonError } from '@/lib/http.js';
import { tryGrantFirst100 } from '@/lib/points.js';
import { getIpLimiter } from '@/lib/ratelimit.js';
import { scoreGame } from '@/lib/scoring.js';
import { deleteSession, getSession } from '@/lib/session.js';
import { getSupabaseAdmin } from '@/lib/supabase.js';
import { todayKstYmd } from '@/lib/words.js';
import { GameSubmitRequestSchema, type GameSubmitResponse } from '@choseong-run/shared';
// POST /api/game/submit
// - 세션의 단어 정답으로 서버에서 점수 재계산
// - 일일 챌린지면 랭킹 등록 + 포인트 자격 부여
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_input', '잘못된 요청입니다.', 400);
  }
  const parsed = GameSubmitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', '입력값이 올바르지 않습니다.', 400);
  }
  const { sessionId, deviceId, userId, results } = parsed.data;

  // IP rate limit
  const ip = getClientIp(req);
  const limited = await getIpLimiter().limit(`submit:${ip}`);
  if (!limited.success) {
    return jsonError('rate_limit', '요청이 너무 빨라요.', 429);
  }

  const session = await getSession(sessionId);
  if (!session) {
    return jsonError('session_invalid', '게임 세션을 찾을 수 없어요. 다시 시작해주세요.', 410);
  }

  // 세션 소유자 검증 (deviceId 일치 필수)
  if (session.deviceId !== deviceId) {
    return jsonError('session_invalid', '세션 소유자가 일치하지 않아요.', 403);
  }

  // 채점
  const authWords = session.words.map((w) => ({
    id: w.id,
    answer: w.word,
    alternates: w.alternates,
  }));
  const outcome = scoreGame(authWords, results);

  // 게임 세션 기록 (정답/입력값은 저장 안 함, privacy)
  const sb = getSupabaseAdmin();
  await sb.from('game_sessions').insert({
    user_id: userId,
    device_id: deviceId,
    mode: session.mode,
    category: session.category,
    started_at: session.startedAt,
    finished_at: new Date().toISOString(),
    score: outcome.totalScore,
    correct_count: outcome.correctCount,
    max_combo: outcome.maxCombo,
    word_ids: session.words.map((w) => w.id),
    word_results: outcome.wordResults,
  });

  // 일일 챌린지: 랭킹 등록 + attempt 기록
  let dailyRank: number | null = null;
  if (session.mode === 'daily') {
    const date = todayKstYmd();
    const { data: existing } = await sb
      .from('daily_leaderboard')
      .select('score')
      .eq('date', date)
      .eq('device_id', deviceId)
      .maybeSingle();
    const previousBest = (existing?.score as number | undefined) ?? 0;
    const newBest = Math.max(previousBest, outcome.totalScore);
    await sb.from('daily_leaderboard').upsert(
      {
        date,
        device_id: deviceId,
        user_id: userId,
        score: newBest,
      },
      { onConflict: 'date,device_id' },
    );
    // 랭크 계산
    const { count } = await sb
      .from('daily_leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('date', date)
      .gt('score', newBest);
    dailyRank = (count ?? 0) + 1;
    // attempt 증가 (RPC가 없으면 upsert fallback)
    const rpcRes = await sb.rpc('increment_daily_attempt', { p_date: date, p_device: deviceId });
    if (rpcRes.error) {
      const { data: cur } = await sb
        .from('daily_attempts')
        .select('attempts')
        .eq('date', date)
        .eq('device_id', deviceId)
        .maybeSingle();
      const attempts = ((cur?.attempts as number | undefined) ?? 0) + 1;
      await sb
        .from('daily_attempts')
        .upsert(
          { date, device_id: deviceId, attempts, best_score: newBest },
          { onConflict: 'date,device_id' },
        );
    }
  }

  // 첫 100점 포인트 자격
  const first100 = await tryGrantFirst100(deviceId, userId, outcome.totalScore);

  // 세션 정리 (재제출 차단)
  await deleteSession(sessionId);

  const response: GameSubmitResponse = {
    sessionId,
    totalScore: outcome.totalScore,
    correctCount: outcome.correctCount,
    maxCombo: outcome.maxCombo,
    wordResults: outcome.wordResults,
    dailyRank,
    pointsAwarded: first100.granted ? first100.amount : 0,
  };
  return NextResponse.json(response);
}
