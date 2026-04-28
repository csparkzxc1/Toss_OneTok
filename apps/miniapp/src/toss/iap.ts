// 인앱결제 (IAP) 래퍼
// SDK v2.x 정식 API는 콘솔 가이드 참고: https://developers-apps-in-toss.toss.im/iap/develop.html
// 현재는 안전한 더미. 출시 시 framework의 IAP 모듈로 교체.

import { PRODUCT_IDS } from '@choseong-run/shared';

export interface PurchaseResult {
  ok: boolean;
  orderId?: string;
  receipt?: string;
  productId?: string;
  reason?: string;
}

export async function requestPurchase(product: 'monthly' | 'lifetime'): Promise<PurchaseResult> {
  const productId = product === 'lifetime' ? PRODUCT_IDS.lifetime : PRODUCT_IDS.monthly;
  // TODO(toss): SDK v2의 IAP requestPayment 호출로 교체.
  void productId;
  return { ok: false, reason: 'sdk_not_wired' };
}

export async function restorePendingOrders(
  _onRestore: (order: { orderId: string; productId: string; receipt: string }) => Promise<void>,
): Promise<void> {
  // TODO(toss): SDK v2의 미결 주문 복원 호출.
}

export async function completeGrant(_orderId: string): Promise<void> {
  // TODO(toss): SDK v2의 productGrant 완료 호출.
}
