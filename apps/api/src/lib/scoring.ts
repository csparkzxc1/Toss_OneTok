import { matchesAnswer } from '@choseong-run/chosung';
// 서버 점수 계산 — 단일 진실의 원천.
// 클라가 보낸 점수는 절대 신뢰하지 않는다. 서버에서 모든 입력에 대해 재계산.
import {
  BASE_POINTS,
  COMBO_BONUS_MS,
  COMBO_BONUS_THRESHOLD,
  COMBO_MAX_MULTIPLIER,
  COMBO_PER_STEP,
  GAME_DURATION_MS,
  type ScoredWord,
  TIME_MIN_MULTIPLIER,
  WRONG_PENALTY_MS,
} from '@choseong-run/shared';

export interface AuthoritativeWord {
  id: string;
  answer: string;
  alternates?: readonly string[];
}

export interface SubmittedResult {
  wordId: string;
  input: string;
  timeMs: number; // 클라가 보고한 풀이 소요 시간 (ms)
}

export interface ScoringOutcome {
  totalScore: number;
  correctCount: number;
  maxCombo: number;
  wordResults: ScoredWord[];
}

/**
 * 30초 게임의 누적 시간을 추적하면서 정답을 채점한다.
 * - 단어별 timeMs는 0~제한시간 사이로 클램프
 * - 누적이 게임 시간 초과면 그 시점 이후 결과는 "포기"로 처리(0점)
 * - 콤보 5마다 +5초 시간 보너스 → 다음 문제 시간 가산
 * - 오답은 +1초 페널티
 */
export function scoreGame(
  authWords: readonly AuthoritativeWord[],
  results: readonly SubmittedResult[],
): ScoringOutcome {
  const lookup = new Map<string, AuthoritativeWord>();
  for (const w of authWords) lookup.set(w.id, w);

  let elapsed = 0;
  let timeBudget = GAME_DURATION_MS;
  let combo = 0;
  let maxCombo = 0;
  let totalScore = 0;
  let correctCount = 0;
  const wordResults: ScoredWord[] = [];

  for (const r of results) {
    const auth = lookup.get(r.wordId);
    if (!auth) {
      // 클라가 위조한 wordId — 이 결과는 무시(점수 0, 채점 안함)
      wordResults.push({ wordId: r.wordId, correct: false, points: 0, combo });
      continue;
    }

    const stepMs = clampStepMs(r.timeMs);
    elapsed += stepMs;

    if (elapsed > timeBudget) {
      // 시간 초과 후 결과는 점수 인정 X
      wordResults.push({ wordId: r.wordId, correct: false, points: 0, combo });
      continue;
    }

    const correct = matchesAnswer(r.input, auth.answer, auth.alternates ?? []);
    if (correct) {
      const remaining = Math.max(0, timeBudget - elapsed);
      const points = computePoints({ combo, remainingMs: remaining });
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      totalScore += points;
      correctCount += 1;
      wordResults.push({ wordId: r.wordId, correct: true, points, combo });

      // 콤보 보너스: 5콤보 달성 시 시간 +5초
      if (combo > 0 && combo % COMBO_BONUS_THRESHOLD === 0) {
        timeBudget += COMBO_BONUS_MS;
      }
    } else {
      combo = 0;
      // 오답 페널티: 시간 -1초 (= 누적 +1초)
      elapsed += WRONG_PENALTY_MS;
      wordResults.push({ wordId: r.wordId, correct: false, points: 0, combo: 0 });
    }
  }

  return { totalScore, correctCount, maxCombo, wordResults };
}

function clampStepMs(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  if (ms > GAME_DURATION_MS) return GAME_DURATION_MS;
  return Math.floor(ms);
}

export function computePoints({
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
