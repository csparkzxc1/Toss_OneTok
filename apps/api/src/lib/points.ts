// 토스 포인트 프로모션 적립 — 첫 100점, 일일 챌린지 완주, 출석 등.
// 실제 적립 호출은 클라(@apps-in-toss/framework)에서 사용자 동의 후 요청하는 방식이 일반적.
// 서버에서는 "자격 발생"만 기록하고, 클라가 SDK로 받아간 뒤 정산 검증을 한다.
import { POINT_PROMOTIONS } from '@choseong-run/shared';
import { getSupabaseAdmin } from './supabase.js';

export interface First100Result {
  granted: boolean;
  promotionId: string;
  amount: number;
}

/**
 * 사용자가 처음으로 100점 이상 달성했는지 판정 + 1회만 자격 부여.
 * device_id 기준 (비로그인도 1회 보장).
 */
export async function tryGrantFirst100(
  deviceId: string,
  userId: string | null,
  totalScore: number,
): Promise<First100Result> {
  const promo = POINT_PROMOTIONS.first_100;
  if (totalScore < 100) return { granted: false, promotionId: promo.id, amount: 0 };
  const sb = getSupabaseAdmin();
  const { data: existing } = await sb
    .from('first_100_awards')
    .select('device_id')
    .eq('device_id', deviceId)
    .maybeSingle();
  if (existing) return { granted: false, promotionId: promo.id, amount: 0 };

  const { error } = await sb.from('first_100_awards').insert({
    device_id: deviceId,
    user_id: userId,
    points_awarded: promo.amount,
  });
  if (error) return { granted: false, promotionId: promo.id, amount: 0 };
  return { granted: true, promotionId: promo.id, amount: promo.amount };
}
