// 익명 디바이스 식별자
// AsyncStorage 기반, 최초 실행 시 생성
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@hanjul-tok/device-id';

function uuid(): string {
  // RFC4122 v4 (간이)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await AsyncStorage.getItem(KEY);
    if (existing) {
      cached = existing;
      return existing;
    }
  } catch {
    /* fall through */
  }
  const next = uuid();
  try {
    await AsyncStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  cached = next;
  return next;
}
