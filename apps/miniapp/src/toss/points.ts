// 토스 포인트 프로모션
// 출석체크/첫 사용 보너스 트리거. 콘솔에서 프로모션 등록 후 promotionId 사용.
import { promotion, time } from '@apps-in-toss/framework';

export interface PromotionResult {
  ok: boolean;
  points?: number;
  reason?: string;
}

export async function grantPoints(promotionId: string): Promise<PromotionResult> {
  try {
    const result = await promotion.grant({ promotionId });
    if (!result?.success) {
      return { ok: false, reason: result?.reason ?? 'unknown' };
    }
    return { ok: true, points: result.points };
  } catch (err) {
    console.warn('[toss.points] grant failed', err);
    return { ok: false, reason: 'sdk_error' };
  }
}

// 출석체크는 클라이언트 시간 대신 토스 서버 시간 사용 (조작 방지)
export async function getServerDate(): Promise<Date> {
  try {
    const ms = await time.getServerTime();
    if (typeof ms === 'number' && ms > 0) return new Date(ms);
  } catch {
    /* fall through */
  }
  return new Date();
}

export const PROMOTION_IDS = {
  attendance3Days: 'hanjul_attend_3d',
  attendance7Days: 'hanjul_attend_7d',
  firstUse: 'hanjul_first_use',
} as const;
