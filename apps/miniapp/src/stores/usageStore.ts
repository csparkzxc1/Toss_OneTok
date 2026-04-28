import { create } from 'zustand';

interface UsageState {
  remaining: number;
  bonusRemaining: number;
  isPremium: boolean;
  resetAt: string | null;
  set: (payload: Partial<Omit<UsageState, 'set' | 'reset'>>) => void;
  reset: () => void;
}

export const useUsageStore = create<UsageState>((set) => ({
  remaining: 0,
  bonusRemaining: 0,
  isPremium: false,
  resetAt: null,
  set: (payload) => set(payload),
  reset: () =>
    set({ remaining: 0, bonusRemaining: 0, isPremium: false, resetAt: null }),
}));
