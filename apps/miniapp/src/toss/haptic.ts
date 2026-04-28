// 햅틱 피드백 래퍼
import { haptics } from '@apps-in-toss/framework';

export type HapticType = 'success' | 'warning' | 'error' | 'selection' | 'impact';

export function triggerHaptic(type: HapticType = 'selection'): void {
  try {
    haptics.notify({ type });
  } catch {
    // 환경 미지원 시 무시
  }
}
