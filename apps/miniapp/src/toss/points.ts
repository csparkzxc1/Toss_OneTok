// 토스 포인트 프로모션
// 콘솔에 등록한 promotionId로 grant 호출. SDK v2 API는 가이드 확인.
import { POINT_PROMOTIONS } from '@choseong-run/shared';

export interface PromotionResult {
  ok: boolean;
  points?: number;
  reason?: string;
}

export async function grantPoints(_promotionId: string): Promise<PromotionResult> {
  // TODO(toss): SDK v2 promotion.grant 호출.
  return { ok: false, reason: 'sdk_not_wired' };
}

// 출석체크는 클라 시간 대신 토스 서버 시간을 써야 위변조 방지.
export async function getServerDate(): Promise<Date> {
  // TODO(toss): SDK v2 서버 시간 API.
  return new Date();
}

export const PROMOTION_IDS = POINT_PROMOTIONS;
