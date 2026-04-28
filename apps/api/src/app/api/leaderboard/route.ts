import { jsonError } from '@/lib/http.js';
import { getSupabaseAdmin } from '@/lib/supabase.js';
import {
  type LeaderboardEntry,
  LeaderboardQuerySchema,
  type LeaderboardResponse,
} from '@choseong-run/shared';
// GET /api/leaderboard?date=YYYY-MM-DD&deviceId=...
// 일일 랭킹 상위 100명 + 본인 랭크
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TOP_N = 100;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deviceId = url.searchParams.get('deviceId');
  const queryParsed = LeaderboardQuerySchema.safeParse({
    date: url.searchParams.get('date') ?? '',
    scope: url.searchParams.get('scope') ?? 'all',
  });
  if (!queryParsed.success) {
    return jsonError('invalid_input', '날짜 형식이 올바르지 않아요.', 400);
  }
  const { date } = queryParsed.data;

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('daily_leaderboard')
    .select('device_id, user_id, score, display_name')
    .eq('date', date)
    .order('score', { ascending: false })
    .limit(TOP_N);

  if (error) {
    return jsonError('server_error', '랭킹을 불러오지 못했어요.', 500);
  }

  const rows = data ?? [];
  const entries: LeaderboardEntry[] = rows.map((r, i) => ({
    rank: i + 1,
    displayName: (r.display_name as string | null) ?? '익명',
    score: r.score as number,
    isMe: deviceId !== null && r.device_id === deviceId,
  }));

  let myRank: number | null = null;
  let myScore: number | null = null;
  if (deviceId) {
    const me = entries.find((e) => e.isMe);
    if (me) {
      myRank = me.rank;
      myScore = me.score;
    } else {
      const { data: myRow } = await sb
        .from('daily_leaderboard')
        .select('score')
        .eq('date', date)
        .eq('device_id', deviceId)
        .maybeSingle();
      if (myRow) {
        myScore = myRow.score as number;
        const { count } = await sb
          .from('daily_leaderboard')
          .select('*', { count: 'exact', head: true })
          .eq('date', date)
          .gt('score', myScore);
        myRank = (count ?? 0) + 1;
      }
    }
  }

  const response: LeaderboardResponse = {
    date,
    entries,
    myRank,
    myScore,
  };
  return NextResponse.json(response);
}
