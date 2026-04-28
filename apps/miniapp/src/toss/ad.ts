// 보상형 광고 (IAA)
// 광고 시청 종료 시 토큰을 받아 백엔드로 전송 → 사용량 +1
import { advertisement } from '@apps-in-toss/framework';

export interface AdResult {
  ok: boolean;
  adToken?: string;
  reason?: string;
}

export async function showRewardedAd(): Promise<AdResult> {
  try {
    const result = await advertisement.showRewarded({
      placement: 'hanjul-tok-result-bonus',
    });
    if (!result?.completed) {
      return { ok: false, reason: 'not_completed' };
    }
    if (!result.token) {
      return { ok: false, reason: 'no_token' };
    }
    return { ok: true, adToken: result.token };
  } catch (err) {
    console.warn('[toss.ad] showRewarded failed', err);
    return { ok: false, reason: 'sdk_error' };
  }
}
