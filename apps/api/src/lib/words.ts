// 단어 풀 관리.
// 우선순위: Redis 캐시 → Supabase daily_word_pool → 시드 JSON fallback
import { isPlayableWord, wordToChosung } from '@choseong-run/chosung';
import type { CategoryId } from '@choseong-run/shared';
import { CATEGORIES, type SeedWord, getSeedWords } from '@choseong-run/words';
import { getRedis } from './redis.js';
import { getSupabaseAdmin } from './supabase.js';

export interface AuthoritativeWord {
  id: string;
  word: string;
  hint: string;
  difficulty: 1 | 2 | 3;
  alternates?: readonly string[];
  category: CategoryId;
}

export interface PublicWord {
  id: string;
  chosung: string;
  hint: string;
  length: number;
}

const CACHE_TTL_SECONDS = 60 * 60 * 24 + 60 * 60; // 25시간 (안전 여유)

function cacheKey(date: string, category: CategoryId): string {
  return `wp:${date}:${category}`;
}

export function todayKstYmd(): string {
  // KST = UTC+9. 자정 갱신 기준은 KST 0시.
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function seedToAuthoritative(category: CategoryId, seed: SeedWord, idx: number): AuthoritativeWord {
  return {
    id: `seed:${category}:${idx}`,
    word: seed.word,
    hint: seed.hint,
    difficulty: seed.difficulty,
    alternates: seed.alternates,
    category,
  };
}

async function loadFromRedis(
  date: string,
  category: CategoryId,
): Promise<AuthoritativeWord[] | null> {
  try {
    const redis = getRedis();
    const cached = await redis.get<AuthoritativeWord[]>(cacheKey(date, category));
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    return null;
  } catch {
    return null;
  }
}

async function loadFromSupabase(
  date: string,
  category: CategoryId,
): Promise<AuthoritativeWord[] | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('daily_word_pool')
      .select('words')
      .eq('date', date)
      .eq('category', category)
      .maybeSingle();
    if (!data?.words || !Array.isArray(data.words)) return null;
    const list = data.words as AuthoritativeWord[];
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

function loadFromSeed(category: CategoryId): AuthoritativeWord[] {
  const seeds = getSeedWords(category);
  return seeds
    .filter((s) => isPlayableWord(s.word))
    .map((s, i) => seedToAuthoritative(category, s, i));
}

export async function getWordPool(category: CategoryId): Promise<AuthoritativeWord[]> {
  const date = todayKstYmd();

  const fromRedis = await loadFromRedis(date, category);
  if (fromRedis) return fromRedis;

  const fromSupabase = await loadFromSupabase(date, category);
  if (fromSupabase) {
    await primeRedisCache(date, category, fromSupabase);
    return fromSupabase;
  }

  // 시드 fallback — 운영 초기/오프라인 동작 보장
  return loadFromSeed(category);
}

async function primeRedisCache(
  date: string,
  category: CategoryId,
  words: AuthoritativeWord[],
): Promise<void> {
  try {
    await getRedis().set(cacheKey(date, category), words, { ex: CACHE_TTL_SECONDS });
  } catch {
    // 캐시 실패는 치명적이지 않음
  }
}

/**
 * 게임 시작용 단어 N개를 무작위로 뽑아 클라용 형태로 변환.
 * 정답은 클라에 보내지 않는다 (chosung + hint만).
 * authoritative는 서버 채점용으로 별도 보관 필요.
 */
export function selectWordsForGame(
  pool: readonly AuthoritativeWord[],
  count: number,
): { authoritative: AuthoritativeWord[]; publics: PublicWord[] } {
  if (pool.length === 0) {
    return { authoritative: [], publics: [] };
  }
  // Fisher-Yates shuffle
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = arr[i] as AuthoritativeWord;
    const b = arr[j] as AuthoritativeWord;
    arr[i] = b;
    arr[j] = a;
  }
  const picked = arr.slice(0, Math.min(count, arr.length));
  const publics: PublicWord[] = picked.map((w) => ({
    id: w.id,
    chosung: wordToChosung(w.word),
    hint: w.hint,
    length: [...w.word].length,
  }));
  return { authoritative: picked, publics };
}

export function getRandomFreeCategory(): CategoryId {
  const free = CATEGORIES.filter((c) => !c.premium);
  const idx = Math.floor(Math.random() * free.length);
  return free[idx]?.id ?? 'food';
}
