// 클립보드 복사 + 햅틱
// RN의 Clipboard 모듈 또는 토스 SDK API 사용. 현재는 안전한 더미.
import { triggerHaptic } from './haptic';

export async function copyText(_text: string): Promise<boolean> {
  // TODO(toss): SDK v2 clipboard 또는 @react-native-clipboard/clipboard로 교체.
  triggerHaptic('selection');
  return false;
}
