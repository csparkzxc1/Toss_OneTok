import type { CategoryId, GameMode, GameSubmitResponse } from '@choseong-run/shared';
// 결과 화면용 — 직전 게임의 서버 응답 보관
import { create } from 'zustand';

interface ResultState {
  result: GameSubmitResponse | null;
  category: CategoryId | null;
  mode: GameMode | null;
  setResult: (result: GameSubmitResponse, category: CategoryId, mode: GameMode) => void;
  clear: () => void;
}

export const useResultStore = create<ResultState>((set) => ({
  result: null,
  category: null,
  mode: null,
  setResult: (result, category, mode) => set({ result, category, mode }),
  clear: () => set({ result: null, category: null, mode: null }),
}));
