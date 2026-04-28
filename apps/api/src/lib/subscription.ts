import { getSupabaseAdmin } from './supabase.js';

export interface SubscriptionLookup {
  isPremium: boolean;
  productId: 'monthly' | 'yearly' | null;
  expiresAt: string | null;
}

export async function getSubscriptionStatus(userId: string | null): Promise<SubscriptionLookup> {
  if (!userId) {
    return { isPremium: false, productId: null, expiresAt: null };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('product_id, status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { isPremium: false, productId: null, expiresAt: null };
  }

  const expiresAt = data.expires_at as string | null;
  const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;

  return {
    isPremium: isActive,
    productId: (data.product_id as 'monthly' | 'yearly') ?? null,
    expiresAt,
  };
}
