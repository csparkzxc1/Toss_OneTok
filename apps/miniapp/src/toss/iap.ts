// 인앱결제 (IAP)
// 가이드: https://developers-apps-in-toss.toss.im/iap/develop.html
import { inAppPurchase } from '@apps-in-toss/framework';
import { PRODUCT_IDS } from '@hanjul-tok/shared';

export interface PurchaseResult {
  ok: boolean;
  orderId?: string;
  receipt?: string;
  productId?: string;
  reason?: string;
}

export async function requestSubscription(
  product: 'monthly' | 'yearly',
): Promise<PurchaseResult> {
  const productId = product === 'yearly' ? PRODUCT_IDS.yearly : PRODUCT_IDS.monthly;
  try {
    const result = await inAppPurchase.requestPayment({ productId });
    if (!result?.success) {
      return { ok: false, reason: result?.reason ?? 'cancelled' };
    }
    return {
      ok: true,
      productId,
      orderId: result.orderId,
      receipt: result.receipt,
    };
  } catch (err) {
    console.warn('[toss.iap] requestPayment failed', err);
    return { ok: false, reason: 'sdk_error' };
  }
}

// 미결 주문 복원: 결제 후 지급 실패한 건 처리. 앱 시작 시 호출.
export async function restorePendingOrders(
  onRestore: (order: { orderId: string; productId: string; receipt: string }) => Promise<void>,
): Promise<void> {
  try {
    const orders = await inAppPurchase.getPendingOrders();
    if (!orders?.length) return;
    for (const order of orders) {
      await onRestore({
        orderId: order.orderId,
        productId: order.productId,
        receipt: order.receipt,
      });
      await inAppPurchase.completeProductGrant({ orderId: order.orderId });
    }
  } catch (err) {
    console.warn('[toss.iap] restore failed', err);
  }
}

export async function completeGrant(orderId: string): Promise<void> {
  try {
    await inAppPurchase.completeProductGrant({ orderId });
  } catch (err) {
    console.warn('[toss.iap] completeGrant failed', err);
  }
}
