// 클라이언트 점수 계산 (표시용 — 서버가 진실).
// 서버 점수 공식과 동일하게 유지: BASE × 콤보배율 × 시간배율
import {
  BASE_POINTS,
  COMBO_MAX_MULTIPLIER,
  COMBO_PER_STEP,
  GAME_DURATION_MS,
  TIME_MIN_MULTIPLIER,
} from '@choseong-run/shared';

export function computePointsClient({
  combo,
  remainingMs,
}: {
  combo: number;
  remainingMs: number;
}): number {
  const comboMul = Math.min(COMBO_MAX_MULTIPLIER, 1.0 + combo * COMBO_PER_STEP);
  const timeMul = Math.max(TIME_MIN_MULTIPLIER, Math.min(1, remainingMs / GAME_DURATION_MS));
  return Math.round(BASE_POINTS * comboMul * timeMul);
}
