import type { Situation, Tone } from './schemas.js';

export type { Situation, Tone };

export interface GenerationRecord {
  id: string;
  situation: Situation;
  tone: Tone;
  context: string;
  candidates: [string, string, string];
  createdAt: string;
}

export interface SubscriptionStatus {
  isPremium: boolean;
  productId: 'monthly' | 'yearly' | null;
  expiresAt: string | null;
}

export interface ApiError {
  code:
    | 'rate_limit'
    | 'usage_exhausted'
    | 'invalid_input'
    | 'auth_required'
    | 'premium_required'
    | 'server_error'
    | 'network_error';
  message: string;
}
