import { create } from 'zustand';

interface SessionState {
  deviceId: string | null;
  userId: string | null;
  tossUserKey: string | null;
  setDeviceId: (id: string) => void;
  setUser: (payload: { userId: string; tossUserKey: string }) => void;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  deviceId: null,
  userId: null,
  tossUserKey: null,
  setDeviceId: (deviceId) => set({ deviceId }),
  setUser: ({ userId, tossUserKey }) => set({ userId, tossUserKey }),
  signOut: () => set({ userId: null, tossUserKey: null }),
}));
