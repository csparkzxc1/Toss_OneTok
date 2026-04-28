// 익명 디바이스 식별자
// AsyncStorage 기반, 최초 실행 시 생성. 모듈 미설치 환경에서는 메모리만 사용.

interface MinimalStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

let storage: MinimalStorage | null = null;
function getStorage(): MinimalStorage | null {
  if (storage) return storage;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@react-native-async-storage/async-storage');
    storage = (mod.default ?? mod) as MinimalStorage;
    return storage;
  } catch {
    return null;
  }
}

const KEY = '@choseong-run/device-id';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  const s = getStorage();
  if (s) {
    try {
      const existing = await s.getItem(KEY);
      if (existing) {
        cached = existing;
        return existing;
      }
    } catch {
      /* ignore */
    }
  }
  const next = uuid();
  if (s) {
    try {
      await s.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }
  cached = next;
  return next;
}
