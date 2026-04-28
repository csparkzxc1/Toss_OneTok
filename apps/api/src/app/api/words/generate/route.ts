import { generateWords } from '@/lib/anthropic.js';
import { getEnv } from '@/lib/env.js';
import { jsonError } from '@/lib/http.js';
import { getRedis } from '@/lib/redis.js';
import { getSupabaseAdmin } from '@/lib/supabase.js';
import { todayKstYmd } from '@/lib/words.js';
import { isPlayableWord } from '@choseong-run/chosung';
import type { CategoryId } from '@choseong-run/shared';
import { CATEGORIES, getSeedWords } from '@choseong-run/words';
// POST /api/words/generate (Vercel Cron 전용)
// - Authorization: Bearer ${CRON_SECRET}
// - 매일 KST 0시 (Vercel Cron은 UTC라 schedule = "0 15 * * *")
// - 카테고리별 단어 30개 생성 → daily_word_pool에 저장 → daily_challenge 1개 결정
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5분

const COUNT_PER_CATEGORY = 30;

interface PoolWord {
  id: string;
  word: string;
  hint: string;
  difficulty: 1 | 2 | 3;
  alternates?: readonly string[];
  category: CategoryId;
}

export async function POST(req: Request) {
  const env = getEnv();
  const auth = req.headers.get('authorization') ?? '';
  if (!env.CRON_SECRET || !auth.startsWith('Bearer ') || auth.slice(7) !== env.CRON_SECRET) {
    return jsonError('auth_required', 'unauthorized', 401);
  }

  const date = todayKstYmd();
  const sb = getSupabaseAdmin();

  const summary: Record<CategoryId, { generated: number; rejected: number }> = {} as Record<
    CategoryId,
    { generated: number; rejected: number }
  >;

  for (const cat of CATEGORIES) {
    try {
      const seedExclude = getSeedWords(cat.id).map((s) => s.word);
      const result = await generateWords({
        category: cat.id,
        count: COUNT_PER_CATEGORY,
        excludeWords: seedExclude,
      });

      const filtered: PoolWord[] = [];
      const seen = new Set<string>();
      // 시드와 합쳐서 풀을 풍부하게: AI 신규 + 검증된 시드
      for (const s of getSeedWords(cat.id)) {
        if (!isPlayableWord(s.word) || seen.has(s.word)) continue;
        seen.add(s.word);
        filtered.push({
          id: `seed:${cat.id}:${s.word}`,
          word: s.word,
          hint: s.hint,
          difficulty: s.difficulty,
          alternates: s.alternates,
          category: cat.id,
        });
      }
      for (const w of result.words) {
        if (seen.has(w.word)) continue;
        seen.add(w.word);
        filtered.push({
          id: `ai:${cat.id}:${date}:${filtered.length}`,
          word: w.word,
          hint: w.hint,
          difficulty: w.difficulty,
          category: cat.id,
        });
      }

      await sb
        .from('daily_word_pool')
        .upsert({ date, category: cat.id, words: filtered }, { onConflict: 'date,category' });

      // Redis 캐시 갱신
      try {
        await getRedis().set(`wp:${date}:${cat.id}`, filtered, { ex: 60 * 60 * 25 });
      } catch {
        // 캐시 갱신 실패는 무시
      }

      summary[cat.id] = {
        generated: filtered.length,
        rejected: result.rejected.length,
      };
    } catch (err) {
      summary[cat.id] = { generated: 0, rejected: -1 };
      console.error(`[words.generate] ${cat.id}`, err);
    }
  }

  // 일일 챌린지 카테고리: 무료 카테고리 중 하나 결정적 선택
  const free = CATEGORIES.filter((c) => !c.premium);
  const today = new Date();
  const seed = today.getUTCFullYear() * 1000 + today.getUTCMonth() * 50 + today.getUTCDate();
  const challengeCat = free[seed % free.length]?.id ?? 'food';

  const { data: pool } = await sb
    .from('daily_word_pool')
    .select('words')
    .eq('date', date)
    .eq('category', challengeCat)
    .maybeSingle();
  const wordList = ((pool?.words as PoolWord[] | undefined) ?? []).slice(0, 30);
  await sb
    .from('daily_challenge')
    .upsert(
      { date, category: challengeCat, word_ids: wordList.map((w) => w.id) },
      { onConflict: 'date' },
    );

  return NextResponse.json({ ok: true, date, summary, challengeCategory: challengeCat });
}
