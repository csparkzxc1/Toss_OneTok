import type { CategoryId, GameMode, ScoredWord } from './schemas.js';

export type { CategoryId, GameMode, ScoredWord };

export interface SubscriptionStatus {
  isPremium: boolean;
  productId: 'monthly' | 'lifetime' | null;
  expiresAt: string | null; // 평생권은 null
}

export interface ApiError {
  code:
    | 'rate_limit'
    | 'usage_exhausted'
    | 'invalid_input'
    | 'auth_required'
    | 'premium_required'
    | 'session_invalid'
    | 'session_expired'
    | 'already_played'
    | 'server_error'
    | 'network_error';
  message: string;
}

// 클라 로컬 게임 기록 (간단한 통계)
export interface LocalGameRecord {
  id: string;
  mode: GameMode;
  category: CategoryId;
  totalScore: number;
  correctCount: number;
  maxCombo: number;
  finishedAt: string;
}
