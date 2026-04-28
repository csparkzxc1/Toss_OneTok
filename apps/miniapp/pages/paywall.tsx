import { syncAuth, verifyIap } from '@/api/client';
import { Button, Card, Screen, useToast } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { PRICES_KRW } from '@/lib/prices';
import { useNavigation } from '@/lib/router';
import { useSessionStore } from '@/stores/sessionStore';
import { useUsageStore } from '@/stores/usageStore';
import { loginWithToss } from '@/toss/auth';
import { requestPurchase } from '@/toss/iap';
import { PRODUCT_IDS } from '@choseong-run/shared';
// 페이월 — 월간 ₩3,900 vs 평생권 ₩14,900
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const BENEFITS = [
  { emoji: '∞', title: '무제한 게임', body: '하루 횟수 제한 없이 즐겨요.' },
  { emoji: '🚫', title: '광고 제거', body: '광고 없이 깔끔하게 플레이.' },
  { emoji: '🔓', title: '잠금 카테고리 3개', body: '아이돌 / 스포츠 / 직업 해제.' },
  { emoji: '📊', title: '통계 페이지', body: '내 실력 추이 확인.' },
  { emoji: '🌙', title: '다크 테마', body: '눈에 편한 다크 모드.' },
];

export default function PaywallPage() {
  const nav = useNavigation();
  const toast = useToast();
  const userId = useSessionStore((s) => s.userId);
  const setUser = useSessionStore((s) => s.setUser);
  const setUsage = useUsageStore((s) => s.set);
  const [busy, setBusy] = useState<'monthly' | 'lifetime' | null>(null);

  async function ensureLogin(): Promise<string | null> {
    if (userId) return userId;
    const user = await loginWithToss();
    if (!user) {
      toast.show('로그인이 필요해요');
      return null;
    }
    try {
      const { userId: synced } = await syncAuth(user.tossUserKey);
      setUser({ userId: synced, tossUserKey: user.tossUserKey });
      return synced;
    } catch {
      toast.show('로그인 동기화에 실패했어요');
      return null;
    }
  }

  async function handleBuy(product: 'monthly' | 'lifetime') {
    setBusy(product);
    try {
      const uid = await ensureLogin();
      if (!uid) return;

      const purchase = await requestPurchase(product);
      if (!purchase.ok || !purchase.orderId || !purchase.receipt) {
        toast.show(purchase.reason === 'cancelled' ? '결제를 취소했어요' : '결제에 실패했어요');
        return;
      }

      await verifyIap({
        userId: uid,
        productId: product === 'lifetime' ? PRODUCT_IDS.lifetime : PRODUCT_IDS.monthly,
        orderId: purchase.orderId,
        receipt: purchase.receipt,
      });

      setUsage({ isPremium: true, remaining: 9999, bonusRemaining: 0 });
      toast.show('프리미엄이 활성화됐어요', 'success');
      nav.replace('index');
    } catch {
      toast.show('결제 처리 중 오류가 발생했어요.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.title}>초성런 프리미엄</Text>
          <Text style={styles.subtitle}>광고 없이, 무제한으로, 더 많은 카테고리로</Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <Card key={b.title} style={styles.benefitCard}>
              <Text style={styles.benefitEmoji}>{b.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitBody}>{b.body}</Text>
              </View>
            </Card>
          ))}
        </View>

        <Card style={styles.priceCard}>
          <Text style={styles.deal}>가장 인기</Text>
          <Text style={styles.priceTitle}>
            평생권 ₩{PRICES_KRW.lifetime.toLocaleString('ko-KR')}
          </Text>
          <Text style={styles.priceSub}>한 번 결제로 평생 사용</Text>
          <Button
            fullWidth
            size="lg"
            loading={busy === 'lifetime'}
            disabled={!!busy}
            onPress={() => handleBuy('lifetime')}
          >
            평생권 구매
          </Button>
        </Card>

        <Card style={styles.priceCardAlt}>
          <Text style={styles.priceTitle}>월간 ₩{PRICES_KRW.monthly.toLocaleString('ko-KR')}</Text>
          <Text style={styles.priceSub}>매월 자동 결제 · 언제든 해지</Text>
          <Button
            variant="secondary"
            fullWidth
            loading={busy === 'monthly'}
            disabled={!!busy}
            onPress={() => handleBuy('monthly')}
          >
            월간 구독
          </Button>
        </Card>

        <Text style={styles.disclaimer}>
          월간 구독은 토스 인앱 설정에서 언제든 해지할 수 있어요. 평생권은 환불 정책에 따라 7일 이내
          미사용 시 환불 가능해요.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  heroEmoji: { fontSize: 56 },
  title: { ...typography.display, color: colors.gray900, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.gray600, textAlign: 'center' },
  benefits: { gap: spacing.xs },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
  },
  benefitEmoji: { fontSize: 28 },
  benefitTitle: { ...typography.bodyBold, color: colors.gray900 },
  benefitBody: { ...typography.caption, color: colors.gray600, marginTop: 2 },
  priceCard: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue100,
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  priceCardAlt: { gap: spacing.xs },
  deal: { ...typography.captionBold, color: colors.warning },
  priceTitle: { ...typography.title1, color: colors.gray900 },
  priceSub: { ...typography.caption, color: colors.gray600 },
  disclaimer: {
    ...typography.small,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
