import { z } from 'zod';
import { CANDIDATE_MAX_LENGTH, CONTEXT_MAX_LENGTH } from './constants.js';

export const SituationSchema = z.enum([
  'reject',
  'apology',
  'request',
  'thanks',
  'congrats',
  'condolence',
  'introduce',
  'reply',
  'breakup',
  'reconcile',
  'announce',
  'etc',
]);

export const ToneSchema = z.enum([
  'polite',
  'casual',
  'witty',
  'firm',
  'warm',
  'business',
  'romance',
  'dialect',
]);

export const GenerateRequestSchema = z.object({
  situation: SituationSchema,
  tone: ToneSchema,
  context: z.string().min(1).max(CONTEXT_MAX_LENGTH),
  deviceId: z.string().min(1).max(128),
  userId: z.string().nullable(),
});

export const GenerateResponseSchema = z.object({
  candidates: z.array(z.string().min(1).max(CANDIDATE_MAX_LENGTH * 2)).length(3),
  remainingFreeUses: z.number().int().nonnegative(),
  isPremium: z.boolean(),
});

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

export const IapVerifyRequestSchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  orderId: z.string().min(1),
  receipt: z.string().min(1),
});

export const AuthSyncRequestSchema = z.object({
  tossUserKey: z.string().min(1),
});

export const ModelCandidatesSchema = z.object({
  candidates: z.array(z.string().min(1)).length(3),
});

export type Situation = z.infer<typeof SituationSchema>;
export type Tone = z.infer<typeof ToneSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;
export type UsageResponse = z.infer<typeof UsageResponseSchema>;
export type BonusRequest = z.infer<typeof BonusRequestSchema>;
export type IapVerifyRequest = z.infer<typeof IapVerifyRequestSchema>;
export type AuthSyncRequest = z.infer<typeof AuthSyncRequestSchema>;
