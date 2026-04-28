import { z } from 'zod';
import { ANSWER_INPUT_MAX_LENGTH, GAME_MODES, WORDS_PER_GAME } from './constants.js';

export const CategoryIdSchema = z.enum([
  'food',
  'animal',
  'place',
  'object',
  'movie',
  'idol',
  'sports',
  'job',
]);

export const GameModeSchema = z.enum(GAME_MODES);

// 게임 시작 — 클라가 카테고리/모드를 보내면 서버가 단어 풀을 만들어 응답
export const GameStartRequestSchema = z.object({
  deviceId: z.string().min(1).max(128),
  userId: z.string().nullable(),
  mode: GameModeSchema,
  category: CategoryIdSchema.optional(), // daily는 서버가 결정
});

// 클라에 보내는 단어 (정답 없음, 초성 + 힌트만)
export const GameWordPublicSchema = z.object({
  id: z.string(),
  chosung: z.string().min(1),
  hint: z.string().min(1),
  length: z.number().int().min(2).max(8), // 자수 표시용
});

export const GameStartResponseSchema = z.object({
  sessionId: z.string(),
  mode: GameModeSchema,
  category: CategoryIdSchema,
  words: z.array(GameWordPublicSchema).min(1).max(WORDS_PER_GAME),
  remainingFreeUses: z.number().int().nonnegative(),
  isPremium: z.boolean(),
  startedAt: z.string(), // ISO
});

// 한 문제 결과 (클라 → 서버)
export const WordResultSchema = z.object({
  wordId: z.string(),
  input: z.string().max(ANSWER_INPUT_MAX_LENGTH),
  timeMs: z.number().int().min(0).max(60_000), // 음수/이상치 차단
});

export const GameSubmitRequestSchema = z.object({
  sessionId: z.string(),
  deviceId: z.string().min(1).max(128),
  userId: z.string().nullable(),
  results: z.array(WordResultSchema).max(WORDS_PER_GAME),
});

// 서버가 재계산한 결과
export const ScoredWordSchema = z.object({
  wordId: z.string(),
  correct: z.boolean(),
  points: z.number().int().min(0),
  combo: z.number().int().min(0),
});

export const GameSubmitResponseSchema = z.object({
  sessionId: z.string(),
  totalScore: z.number().int().min(0),
  correctCount: z.number().int().min(0),
  maxCombo: z.number().int().min(0),
  wordResults: z.array(ScoredWordSchema),
  // 일일 챌린지일 때 랭킹
  dailyRank: z.number().int().nullable(),
  // 토스 포인트 적립 결과 (플랫폼 전송)
  pointsAwarded: z.number().int().min(0).default(0),
});

// 일일 챌린지
export const DailyTodayResponseSchema = z.object({
  date: z.string(), // YYYY-MM-DD (KST)
  category: CategoryIdSchema,
  played: z.boolean(),
  reviveAvailable: z.boolean(),
});

// 사용량
export const UsageResponseSchema = z.object({
  remaining: z.number().int().nonnegative(),
  bonusRemaining: z.number().int().nonnegative(),
  isPremium: z.boolean(),
  resetAt: z.string(),
});

export const BonusRequestSchema = z.object({
  deviceId: z.string().min(1).max(128),
  userId: z.string().nullable(),
  adToken: z.string().min(1),
});

// IAP
export const IapVerifyRequestSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  orderId: z.string().min(1),
  receipt: z.string().min(1),
});

// Auth
export const AuthSyncRequestSchema = z.object({
  tossUserKey: z.string().min(1),
});

// 랭킹
export const LeaderboardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scope: z.enum(['all', 'friends']).default('all'),
});

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  displayName: z.string(),
  score: z.number().int().min(0),
  isMe: z.boolean(),
});

export const LeaderboardResponseSchema = z.object({
  date: z.string(),
  entries: z.array(LeaderboardEntrySchema),
  myRank: z.number().int().nullable(),
  myScore: z.number().int().nullable(),
});

// AI 단어 생성 (모델 출력)
export const ModelWordsSchema = z.object({
  words: z
    .array(
      z.object({
        word: z.string().min(2).max(5),
        hint: z.string().min(1).max(80),
        difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      }),
    )
    .min(1)
    .max(50),
});

export type CategoryId = z.infer<typeof CategoryIdSchema>;
export type GameMode = z.infer<typeof GameModeSchema>;
export type GameStartRequest = z.infer<typeof GameStartRequestSchema>;
export type GameStartResponse = z.infer<typeof GameStartResponseSchema>;
export type GameWordPublic = z.infer<typeof GameWordPublicSchema>;
export type WordResult = z.infer<typeof WordResultSchema>;
export type GameSubmitRequest = z.infer<typeof GameSubmitRequestSchema>;
export type GameSubmitResponse = z.infer<typeof GameSubmitResponseSchema>;
export type ScoredWord = z.infer<typeof ScoredWordSchema>;
export type DailyTodayResponse = z.infer<typeof DailyTodayResponseSchema>;
export type UsageResponse = z.infer<typeof UsageResponseSchema>;
export type BonusRequest = z.infer<typeof BonusRequestSchema>;
export type IapVerifyRequest = z.infer<typeof IapVerifyRequestSchema>;
export type AuthSyncRequest = z.infer<typeof AuthSyncRequestSchema>;
export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;
export type ModelWords = z.infer<typeof ModelWordsSchema>;
