import { useEffect, useState } from 'react';
import { getDeviceId } from '@/lib/deviceId';
import { useSessionStore } from '@/stores/sessionStore';
import { getCurrentUser } from '@/toss/auth';
import { restorePendingOrders } from '@/toss/iap';
import { syncAuth, verifyIap } from '@/api/client';

export function useBootstrap() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const deviceId = await getDeviceId();
      if (cancelled) return;
      useSessionStore.getState().setDeviceId(deviceId);

      // 토스 세션 복원 시도 (이미 로그인된 경우만)
      const user = await getCurrentUser();
      if (cancelled) return;
      if (user) {
        try {
          const { userId } = await syncAuth(user.tossUserKey);
          useSessionStore.getState().setUser({ userId, tossUserKey: user.tossUserKey });

          // 미결 IAP 주문 복원
          await restorePendingOrders(async (order) => {
            await verifyIap({
              userId,
              productId: order.productId,
              orderId: order.orderId,
              receipt: order.receipt,
            });
          });
        } catch (err) {
          console.warn('[bootstrap] auth sync failed', err);
        }
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { ready };
}
