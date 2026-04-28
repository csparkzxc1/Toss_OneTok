// IAP 영수증 검증 — 토스 IAP Verify API 호출.
// 공식: https://developers-apps-in-toss.toss.im/iap/verify-receipt.html
import { PRODUCT_IDS } from '@choseong-run/shared';
import { getEnv } from './env.js';
import { getSupabaseAdmin } from './supabase.js';

export interface VerifyInput {
  userId: string;
  productId: string;
  orderId: string;
  receipt: string;
}

export interface VerifyOutcome {
  ok: boolean;
  reason?: string;
  expiresAt?: string | null;
}

interface TossVerifyResponse {
  status?: 'paid' | 'cancelled' | 'refunded' | 'failed';
  productId?: string;
  expiresAt?: string;
  // ... 실제 스펙은 콘솔/문서 확인. 운영 직전에 정합성 점검 필요.
}

async function callTossVerify(input: VerifyInput): Promise<TossVerifyResponse | null> {
  const env = getEnv();
  if (!env.TOSS_APP_KEY) return null;
  try {
    const res = await fetch(env.TOSS_IAP_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.TOSS_APP_KEY}`,
      },
      body: JSON.stringify({
        receipt: input.receipt,
        productId: input.productId,
        orderId: input.orderId,
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as TossVerifyResponse;
  } catch {
    return null;
  }
}

function computeExpiresAt(productId: string): string | null {
  if (productId === PRODUCT_IDS.lifetime) return null;
  // monthly: 30일 후 — 운영 시 토스 응답의 expiresAt이 있으면 그 값을 우선 사용.
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

export async function verifyAndGrant(input: VerifyInput): Promise<VerifyOutcome> {
  const verify = await callTossVerify(input);
  if (!verify) {
    return { ok: false, reason: 'verify_failed' };
  }
  if (verify.status !== 'paid') {
    return { ok: false, reason: `status:${verify.status ?? 'unknown'}` };
  }
  if (verify.productId && verify.productId !== input.productId) {
    return { ok: false, reason: 'product_mismatch' };
  }

  const expiresAt = verify.expiresAt ?? computeExpiresAt(input.productId);

  const sb = getSupabaseAdmin();
  const { error } = await sb.from('subscriptions').upsert(
    {
      user_id: input.userId,
      product_id: input.productId,
      order_id: input.orderId,
      status: 'active',
      expires_at: expiresAt,
    },
    { onConflict: 'order_id' },
  );

  if (error) {
    return { ok: false, reason: 'db_error' };
  }

  return { ok: true, expiresAt };
}
