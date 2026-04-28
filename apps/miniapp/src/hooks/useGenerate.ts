import { useMutation } from '@tanstack/react-query';
import type { GenerateRequest, GenerateResponse } from '@hanjul-tok/shared';
import { ApiError, generateMessages } from '@/api/client';
import { useUsageStore } from '@/stores/usageStore';

export function useGenerate() {
  return useMutation<GenerateResponse, ApiError, Omit<GenerateRequest, 'deviceId' | 'userId'> & {
    deviceId: string;
    userId: string | null;
  }>({
    mutationFn: async (input) => generateMessages(input),
    onSuccess: (data) => {
      useUsageStore.getState().set({
        remaining: data.remainingFreeUses,
        isPremium: data.isPremium,
      });
    },
  });
}
