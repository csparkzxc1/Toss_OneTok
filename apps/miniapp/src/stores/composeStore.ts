import { create } from 'zustand';
import type { Situation, Tone } from '@hanjul-tok/shared';

interface ComposeState {
  situation: Situation | null;
  tone: Tone | null;
  context: string;
  candidates: string[] | null;
  setSituation: (s: Situation) => void;
  setTone: (t: Tone) => void;
  setContext: (c: string) => void;
  setCandidates: (c: string[]) => void;
  reset: () => void;
}

export const useComposeStore = create<ComposeState>((set) => ({
  situation: null,
  tone: null,
  context: '',
  candidates: null,
  setSituation: (situation) => set({ situation }),
  setTone: (tone) => set({ tone }),
  setContext: (context) => set({ context }),
  setCandidates: (candidates) => set({ candidates }),
  reset: () => set({ situation: null, tone: null, context: '', candidates: null }),
}));
