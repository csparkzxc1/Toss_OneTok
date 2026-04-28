// 햅틱 피드백 래퍼
// SDK v2.x의 정확한 햅틱 API는 가이드 참고. 미지원 환경에서는 silent fail.
export type HapticType = 'success' | 'warning' | 'error' | 'selection' | 'impact';

export function triggerHaptic(_type: HapticType = 'selection'): void {
  // TODO(toss): SDK v2 햅틱 API 연결.
  // RN의 Vibration API가 fallback으로 가능.
}
