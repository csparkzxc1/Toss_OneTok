import { PRODUCT_IDS } from '@choseong-run/shared';
import { getSupabaseAdmin } from './supabase.js';

export interface SubscriptionLookup {
  isPremium: boolean;
  productId: 'monthly' | 'lifetime' | null;
  expiresAt: string | null;
}

export async function getSubscriptionStatus(userId: string | null): Promise<SubscriptionLookup> {
  if (!userId) {
    return { isPremium: false, productId: null, expiresAt: null };
  }

  const supabase = getSupabaseAdmin();
  // 평생권(expires_at NULL)은 우선 노출되도록 nulls first 정렬
  const { data, error } = await supabase
    .from('subscriptions')
    .select('product_id, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expires_at', { ascending: false, nullsFirst: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { isPremium: false, productId: null, expiresAt: null };
  }

  const productId = data.product_id as string;
  const expiresAt = (data.expires_at as string | null) ?? null;
  const isLifetime = productId === PRODUCT_IDS.lifetime;
  const isActive = isLifetime ? true : expiresAt !== null && new Date(expiresAt) > new Date();

  if (!isActive) {
    return { isPremium: false, productId: null, expiresAt: null };
  }

  return {
    isPremium: true,
    productId: isLifetime ? 'lifetime' : 'monthly',
    expiresAt: isLifetime ? null : expiresAt,
  };
}
