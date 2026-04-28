// 보상형 광고 (IAA) 래퍼
// 광고 시청 종료 시 토큰을 받아 백엔드로 전송 → 사용량 +1
// SDK v2.x: showFullScreenAd / loadFullScreenAd 사용 가능.
// 가이드: https://developers-apps-in-toss.toss.im/ad/intro.html

export interface AdResult {
  ok: boolean;
  adToken?: string;
  reason?: string;
}

export async function showRewardedAd(): Promise<AdResult> {
  // TODO(toss): SDK v2의 보상형 광고 API로 교체.
  // 예시:
  // const { showFullScreenAd } = await import('@apps-in-toss/framework');
  // const dispose = showFullScreenAd({ ... });
  return { ok: false, reason: 'sdk_not_wired' };
}
