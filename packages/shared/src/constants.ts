// 게임 상수 — 클라/서버 공유
export const GAME_DURATION_MS = 30_000; // 30초
export const WORDS_PER_GAME = 30; // 한 게임 단어 수 (시간 안에 다 못 풀 수도 있음)
export const COMBO_BONUS_THRESHOLD = 5; // 5콤보마다 보너스
export const COMBO_BONUS_MS = 5_000; // +5초
export const WRONG_PENALTY_MS = 1_000; // 오답 페널티 1초

// 점수
export const BASE_POINTS = 100;
export const COMBO_PER_STEP = 0.1;
export const COMBO_MAX_MULTIPLIER = 2.0;
export const TIME_MIN_MULTIPLIER = 0.5;

// 사용량
export const FREE_DAILY_LIMIT_ANON = 3;
export const FREE_DAILY_LIMIT_LOGGED_IN = 5;
export const BONUS_DAILY_LIMIT = 5; // 광고 보너스 일일 상한
export const DAILY_CHALLENGE_REVIVE_LIMIT = 1;

// 모드 (GameMode 타입은 schemas.ts에서 단일 정의)
export const GAME_MODES = ['normal', 'daily'] as const;

// IAP
export const PRODUCT_IDS = {
  monthly: 'choseong_run_monthly',
  lifetime: 'choseong_run_lifetime',
} as const;

export const PRODUCT_PRICES_KRW = {
  monthly: 3_900,
  lifetime: 14_900,
} as const;

// 토스 포인트 프로모션
export const POINT_PROMOTIONS = {
  attend_7d: { id: 'choseong_attend_7d', amount: 200 },
  first_100: { id: 'choseong_first_100', amount: 50 },
  daily_complete: { id: 'choseong_daily_complete', amount: 30 },
} as const;

// 입력 길이 상한 (자모 분리 입력 대비, 5자 + 자모 8개 정도 여유)
export const ANSWER_INPUT_MAX_LENGTH = 32;

// 기본 카테고리 4종 (무료) — 실제 잠금/노출은 packages/words에서
export const FREE_CATEGORY_IDS = ['food', 'animal', 'place', 'object', 'movie'] as const;
export const PREMIUM_CATEGORY_IDS = ['idol', 'sports', 'job'] as const;
