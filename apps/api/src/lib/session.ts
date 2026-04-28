// 게임 세션 — 서버가 발급한 wordIds + 정답을 30분 보관.
// 클라가 submit할 때 이 진실의 원천으로 채점.
import type { CategoryId, GameMode } from '@choseong-run/shared';
import { getRedis } from './redis.js';
import type { AuthoritativeWord } from './words.js';

const SESSION_TTL_SECONDS = 60 * 30; // 30분
const sessionKey = (id: string) => `session:${id}`;

export interface GameSession {
  id: string;
  deviceId: string;
  userId: string | null;
  mode: GameMode;
  category: CategoryId;
  words: AuthoritativeWord[];
  startedAt: string; // ISO
}

export function newSessionId(): string {
  // 단순 random; 충돌 가능성 무시할 수 있는 수준
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveSession(session: GameSession): Promise<void> {
  await getRedis().set(sessionKey(session.id), session, { ex: SESSION_TTL_SECONDS });
}

export async function getSession(id: string): Promise<GameSession | null> {
  try {
    const data = await getRedis().get<GameSession>(sessionKey(id));
    return data ?? null;
  } catch {
    return null;
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await getRedis().del(sessionKey(id));
  } catch {
    // ignore
  }
}
