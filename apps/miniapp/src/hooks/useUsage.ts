import { getUsage } from '@/api/client';
import { useSessionStore } from '@/stores/sessionStore';
import { useUsageStore } from '@/stores/usageStore';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useUsage() {
  const deviceId = useSessionStore((s) => s.deviceId);
  const userId = useSessionStore((s) => s.userId);

  const query = useQuery({
    queryKey: ['usage', deviceId, userId],
    queryFn: () => getUsage(deviceId!, userId),
    enabled: !!deviceId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      useUsageStore.getState().set({
        remaining: query.data.remaining,
        bonusRemaining: query.data.bonusRemaining,
        isPremium: query.data.isPremium,
        resetAt: query.data.resetAt,
      });
    }
  }, [query.data]);

  return query;
}
