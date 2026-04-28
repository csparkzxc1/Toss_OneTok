// 게임 상태 머신 (순수 함수형)
// - reducer 패턴: action → 새 상태
// - UI는 이 상태를 구독만 한다
// - 점수는 클라에서도 표시용으로 계산하지만, 최종 점수는 서버 응답이 진실
import {
  COMBO_BONUS_MS,
  COMBO_BONUS_THRESHOLD,
  GAME_DURATION_MS,
  WRONG_PENALTY_MS,
} from '@choseong-run/shared';
import { computePointsClient } from './scoring.js';

export interface GameWord {
  id: string;
  chosung: string;
  hint: string;
  length: number;
}

export interface SubmittedAttempt {
  wordId: string;
  input: string;
  timeMs: number;
  correctClient: boolean;
}

export type GameStatus = 'idle' | 'playing' | 'finished';

export interface GameState {
  status: GameStatus;
  words: readonly GameWord[];
  currentIndex: number;
  remainingMs: number; // 진짜 남은 시간 예산
  combo: number;
  maxCombo: number;
  scoreClient: number;
  attempts: SubmittedAttempt[];
  flash: 'correct' | 'wrong' | 'comboBonus' | null;
  flashAt: number;
  lastTickAt: number; // TICK 델타 계산용 (monotonic ms)
  currentWordStartedAt: number;
}

export type Action =
  | { type: 'START'; words: readonly GameWord[]; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'SUBMIT'; input: string; correct: boolean; now: number }
  | { type: 'SKIP'; now: number }
  | { type: 'CLEAR_FLASH' }
  | { type: 'FINISH' };

export function initialState(): GameState {
  return {
    status: 'idle',
    words: [],
    currentIndex: 0,
    remainingMs: GAME_DURATION_MS,
    combo: 0,
    maxCombo: 0,
    scoreClient: 0,
    attempts: [],
    flash: null,
    flashAt: 0,
    lastTickAt: 0,
    currentWordStartedAt: 0,
  };
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        ...initialState(),
        status: 'playing',
        words: action.words,
        currentIndex: 0,
        remainingMs: GAME_DURATION_MS,
        lastTickAt: action.now,
        currentWordStartedAt: action.now,
      };
    }

    case 'TICK': {
      if (state.status !== 'playing') return state;
      const dt = Math.max(0, action.now - state.lastTickAt);
      const newRemaining = state.remainingMs - dt;
      if (newRemaining <= 0) {
        return {
          ...state,
          status: 'finished',
          remainingMs: 0,
          lastTickAt: action.now,
        };
      }
      return { ...state, remainingMs: newRemaining, lastTickAt: action.now };
    }

    case 'SUBMIT': {
      if (state.status !== 'playing') return state;
      const wordIndex = state.currentIndex;
      const word = state.words[wordIndex];
      if (!word) return state;

      const timeMs = Math.max(0, action.now - state.currentWordStartedAt);
      const attempt: SubmittedAttempt = {
        wordId: word.id,
        input: action.input,
        timeMs,
        correctClient: action.correct,
      };
      const nextAttempts = [...state.attempts, attempt];

      // 누적된 시간을 일단 반영 (TICK이 누락된 경우에도 정확)
      const dt = Math.max(0, action.now - state.lastTickAt);
      let remaining = Math.max(0, state.remainingMs - dt);

      if (action.correct) {
        const nextCombo = state.combo + 1;
        const isComboBonus = nextCombo > 0 && nextCombo % COMBO_BONUS_THRESHOLD === 0;
        const points = computePointsClient({ combo: state.combo, remainingMs: remaining });
        if (isComboBonus) remaining += COMBO_BONUS_MS;
        const nextIndex = wordIndex + 1;
        const finished = nextIndex >= state.words.length || remaining <= 0;
        return {
          ...state,
          combo: nextCombo,
          maxCombo: Math.max(state.maxCombo, nextCombo),
          scoreClient: state.scoreClient + points,
          remainingMs: finished && remaining <= 0 ? 0 : remaining,
          attempts: nextAttempts,
          currentIndex: finished ? wordIndex : nextIndex,
          currentWordStartedAt: action.now,
          lastTickAt: action.now,
          status: finished ? 'finished' : 'playing',
          flash: isComboBonus ? 'comboBonus' : 'correct',
          flashAt: action.now,
        };
      }

      // 오답: 콤보 리셋 + 시간 페널티
      remaining = Math.max(0, remaining - WRONG_PENALTY_MS);
      const nextIndex = wordIndex + 1;
      const finished = nextIndex >= state.words.length || remaining <= 0;
      return {
        ...state,
        combo: 0,
        attempts: nextAttempts,
        remainingMs: remaining,
        currentIndex: finished ? wordIndex : nextIndex,
        currentWordStartedAt: action.now,
        lastTickAt: action.now,
        status: finished ? 'finished' : 'playing',
        flash: 'wrong',
        flashAt: action.now,
      };
    }

    case 'SKIP': {
      if (state.status !== 'playing') return state;
      const wordIndex = state.currentIndex;
      const word = state.words[wordIndex];
      if (!word) return state;
      const timeMs = Math.max(0, action.now - state.currentWordStartedAt);
      const nextIndex = wordIndex + 1;
      const finished = nextIndex >= state.words.length;
      return {
        ...state,
        combo: 0,
        attempts: [...state.attempts, { wordId: word.id, input: '', timeMs, correctClient: false }],
        currentIndex: finished ? wordIndex : nextIndex,
        currentWordStartedAt: action.now,
        lastTickAt: action.now,
        status: finished ? 'finished' : 'playing',
      };
    }

    case 'CLEAR_FLASH': {
      if (!state.flash) return state;
      return { ...state, flash: null };
    }

    case 'FINISH': {
      if (state.status === 'finished') return state;
      return { ...state, status: 'finished', remainingMs: 0 };
    }

    default:
      return state;
  }
}

export function currentWord(state: GameState): GameWord | null {
  return state.words[state.currentIndex] ?? null;
}
