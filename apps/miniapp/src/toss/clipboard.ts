// 클립보드 복사 + 햅틱
import { clipboard } from '@apps-in-toss/framework';
import { triggerHaptic } from './haptic';

export async function copyText(text: string): Promise<boolean> {
  try {
    await clipboard.write({ text });
    triggerHaptic('success');
    return true;
  } catch (err) {
    console.warn('[toss.clipboard] failed', err);
    return false;
  }
}
