import { type Action, type GameState, gameReducer, initialState } from '@/game/engine';
// 진행 중 게임 상태 (Zustand)
// 게임 엔진의 reducer 결과를 보관 + 외부에서 dispatch 호출.
import { create } from 'zustand';

interface GameStore extends GameState {
  sessionId: string | null;
  category: import('@choseong-run/shared').CategoryId | null;
  mode: 'normal' | 'daily';
  setSession: (
    sessionId: string,
    category: import('@choseong-run/shared').CategoryId,
    mode: 'normal' | 'daily',
  ) => void;
  dispatch: (action: Action) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),
  sessionId: null,
  category: null,
  mode: 'normal',
  setSession: (sessionId, category, mode) => set({ sessionId, category, mode }),
  dispatch: (action) => {
    const next = gameReducer(get(), action);
    set(next);
  },
  resetGame: () => set({ ...initialState(), sessionId: null, category: null, mode: 'normal' }),
}));
