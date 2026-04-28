import { env } from '@/lib/env';
import {
  type DailyTodayResponse,
  DailyTodayResponseSchema,
  type GameStartRequest,
  type GameStartResponse,
  GameStartResponseSchema,
  type GameSubmitRequest,
  type GameSubmitResponse,
  GameSubmitResponseSchema,
  type LeaderboardResponse,
  LeaderboardResponseSchema,
  type UsageResponse,
  UsageResponseSchema,
} from '@choseong-run/shared';

class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = `${env.apiBaseUrl}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('network_error', '네트워크 연결을 확인해주세요.', 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errPayload = (data as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiError(
      errPayload?.code ?? 'server_error',
      errPayload?.message ?? '요청 처리 중 오류가 발생했어요.',
      res.status,
    );
  }
  return data as T;
}

export async function startGame(input: GameStartRequest): Promise<GameStartResponse> {
  const raw = await request<unknown>('/api/game/start', { method: 'POST', body: input });
  const parsed = GameStartResponseSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError('server_error', '응답 형식이 올바르지 않아요.', 500);
  return parsed.data;
}

export async function submitGame(input: GameSubmitRequest): Promise<GameSubmitResponse> {
  const raw = await request<unknown>('/api/game/submit', { method: 'POST', body: input });
  const parsed = GameSubmitResponseSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError('server_error', '응답 형식이 올바르지 않아요.', 500);
  return parsed.data;
}

export async function getUsage(deviceId: string, userId: string | null): Promise<UsageResponse> {
  const params = new URLSearchParams({ deviceId });
  if (userId) params.set('userId', userId);
  const raw = await request<unknown>(`/api/usage?${params.toString()}`);
  const parsed = UsageResponseSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError('server_error', '응답 형식이 올바르지 않아요.', 500);
  return parsed.data;
}

export async function claimAdBonus(input: {
  deviceId: string;
  userId: string | null;
  adToken: string;
}): Promise<{ ok: boolean; bonusEarned: number }> {
  return request('/api/usage', { method: 'POST', body: input });
}

export async function getDailyToday(deviceId: string): Promise<DailyTodayResponse> {
  const raw = await request<unknown>(`/api/daily/today?deviceId=${encodeURIComponent(deviceId)}`);
  const parsed = DailyTodayResponseSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError('server_error', '응답 형식이 올바르지 않아요.', 500);
  return parsed.data;
}

export async function getLeaderboard(
  date: string,
  deviceId: string | null,
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams({ date, scope: 'all' });
  if (deviceId) params.set('deviceId', deviceId);
  const raw = await request<unknown>(`/api/leaderboard?${params.toString()}`);
  const parsed = LeaderboardResponseSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError('server_error', '응답 형식이 올바르지 않아요.', 500);
  return parsed.data;
}

export async function syncAuth(tossUserKey: string): Promise<{ userId: string }> {
  return request('/api/auth/sync', { method: 'POST', body: { tossUserKey } });
}

export async function verifyIap(input: {
  userId: string;
  productId: string;
  orderId: string;
  receipt: string;
}): Promise<{ ok: boolean; expiresAt: string | null }> {
  return request('/api/iap/verify', { method: 'POST', body: input });
}

export { ApiError };
