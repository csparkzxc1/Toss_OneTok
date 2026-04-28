import { NextResponse } from 'next/server';
import { IapVerifyRequestSchema, PRODUCT_IDS } from '@hanjul-tok/shared';
import { getEnv } from '@/lib/env.js';
import { jsonError } from '@/lib/http.js';
import { getSupabaseAdmin } from '@/lib/supabase.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCT_DURATION_MS: Record<string, number> = {
  [PRODUCT_IDS.monthly]: 30 * 24 * 60 * 60 * 1000,
  [PRODUCT_IDS.yearly]: 365 * 24 * 60 * 60 * 1000,
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_input', '잘못된 요청입니다.', 400);
  }

  const parsed = IapVerifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_input', '결제 정보가 올바르지 않습니다.', 400);
  }
  const { userId, productId, orderId, receipt } = parsed.data;

  const duration = PRODUCT_DURATION_MS[productId];
  if (!duration) {
    return jsonError('invalid_input', '알 수 없는 상품입니다.', 400);
  }

  const env = getEnv();
  // 토스 IAP 영수증 검증 호출
  // 실제 헤더/바디 포맷은 https://developers-apps-in-toss.toss.im/iap/develop.html 참고
  let verifyOk = false;
  try {
    const res = await fetch(env.TOSS_IAP_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.TOSS_APP_KEY}`,
      },
      body: JSON.stringify({ orderId, receipt, productId }),
    });
    if (res.ok) {
      const data = await res.json();
      verifyOk = data?.status === 'PAID' || data?.verified === true;
    }
  } catch (err) {
    console.error('[iap.verify.fetch]', err);
  }

  // 개발 환경에서는 외부 호출 실패 시 영수증 길이 기반 통과 (샌드박스 폴백)
  if (!verifyOk && env.NODE_ENV !== 'production' && receipt.length >= 16) {
    verifyOk = true;
  }

  if (!verifyOk) {
    return jsonError('server_error', '영수증 검증에 실패했어요.', 402);
  }

  const expiresAt = new Date(Date.now() + duration).toISOString();
  const supabase = getSupabaseAdmin();

  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      product_id: productId === PRODUCT_IDS.yearly ? 'yearly' : 'monthly',
      order_id: orderId,
      status: 'active',
      expires_at: expiresAt,
    },
    { onConflict: 'order_id' },
  );

  if (error) {
    console.error('[iap.verify.upsert]', error);
    return jsonError('server_error', '구독 저장 중 오류가 발생했어요.', 500);
  }

  return NextResponse.json({ ok: true, expiresAt });
}
