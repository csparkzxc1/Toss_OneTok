import { getEnv } from '@/lib/env.js';
import { jsonError } from '@/lib/http.js';
import { verifyAndGrant } from '@/lib/iap.js';
import { IapVerifyRequestSchema, PRODUCT_IDS } from '@choseong-run/shared';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PRODUCTS = new Set<string>([PRODUCT_IDS.monthly, PRODUCT_IDS.lifetime]);

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

  const { productId } = parsed.data;
  if (!VALID_PRODUCTS.has(productId)) {
    return jsonError('invalid_input', '알 수 없는 상품입니다.', 400);
  }

  const result = await verifyAndGrant(parsed.data);

  // 개발 환경 폴백: 외부 호출 미설정 또는 실패 시 receipt 길이 기반 통과
  if (!result.ok) {
    const env = getEnv();
    if (env.NODE_ENV !== 'production' && parsed.data.receipt.length >= 16) {
      const expiresAt =
        productId === PRODUCT_IDS.lifetime
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      return NextResponse.json({ ok: true, expiresAt, devFallback: true });
    }
    return jsonError('server_error', '영수증 검증에 실패했어요.', 402);
  }

  return NextResponse.json({ ok: true, expiresAt: result.expiresAt ?? null });
}
