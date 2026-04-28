import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@granite-js/react-native';
import { PRODUCT_IDS } from '@hanjul-tok/shared';
import { Button, Card, Screen, useToast } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { syncAuth, verifyIap } from '@/api/client';
import { loginWithToss } from '@/toss/auth';
import { requestSubscription } from '@/toss/iap';
import { useSessionStore } from '@/stores/sessionStore';
import { useUsageStore } from '@/stores/usageStore';

const BENEFITS = [
  { emoji: '∞', title: '무제한 사용', body: '하루 횟수 제한 없이 메시지를 만들 수 있어요.' },
  { emoji: '✨', title: '고급 톤 해제', body: '비즈니스 / 연애 / 사투리 톤을 사용할 수 있어요.' },
  { emoji: '📚', title: '히스토리 저장', body: '만든 메시지를 모아 다시 볼 수 있어요.' },
];

export default function PaywallPage() {
  const router = useRouter();
  const toast = useToast();
  const userId = useSessionStore((s) => s.userId);
  const setUser = useSessionStore((s) => s.setUser);
  const setUsage = useUsageStore((s) => s.set);
  const [busy, setBusy] = useState<'monthly' | 'yearly' | null>(null);

  async function ensureLogin(): Promise<string | null> {
    if (userId) return userId;
    const user = await loginWithToss();
    if (!user) {
      toast.show('로그인이 필요해요', 'default');
      return null;
    }
    try {
      const { userId: synced } = await syncAuth(user.tossUserKey);
      setUser({ userId: synced, tossUserKey: user.tossUserKey });
      return synced;
    } catch {
      toast.show('로그인 동기화에 실패했어요', 'danger');
      return null;
    }
  }

  async function handleBuy(product: 'monthly' | 'yearly') {
    setBusy(product);
    try {
      const uid = await ensureLogin();
      if (!uid) return;

      const purchase = await requestSubscription(product);
      if (!purchase.ok || !purchase.orderId || !purchase.receipt) {
        toast.show(
          purchase.reason === 'cancelled' ? '결제를 취소했어요' : '결제에 실패했어요',
          purchase.reason === 'cancelled' ? 'default' : 'danger',
        );
        return;
      }

      await verifyIap({
        userId: uid,
        productId:
          product === 'yearly' ? PRODUCT_IDS.yearly : PRODUCT_IDS.monthly,
        orderId: purchase.orderId,
        receipt: purchase.receipt,
      });

      setUsage({ isPremium: true, remaining: 9999, bonusRemaining: 0 });
      toast.show('프리미엄이 활성화됐어요', 'success');
      router.replace('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : '결제 처리 중 오류가 발생했어요.';
      toast.show(message, 'danger');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen scroll padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={[typography.display, styles.title]}>한줄톡 프리미엄</Text>
          <Text style={[typography.body, styles.subtitle]}>
            매일 막히는 메시지, 바로바로 보내세요.
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <Card key={b.title} style={styles.benefitCard}>
              <Text style={styles.benefitEmoji}>{b.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, styles.benefitTitle]}>{b.title}</Text>
                <Text style={[typography.caption, styles.benefitBody]}>{b.body}</Text>
              </View>
            </Card>
          ))}
        </View>

        <Card elevated style={styles.priceCard}>
          <Text style={[typography.captionBold, { color: colors.warning }]}>33% 할인</Text>
          <Text style={[typography.title1, styles.priceTitle]}>연간 ₩24,000</Text>
          <Text style={[typography.caption, { color: colors.gray600 }]}>월 약 2,000원 꼴</Text>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={busy === 'yearly'}
            disabled={!!busy}
            onPress={() => handleBuy('yearly')}
            style={{ marginTop: spacing.sm }}
          >
            연간 구독하기
          </Button>
        </Card>

        <Card style={styles.priceCardAlt}>
          <Text style={[typography.title2, styles.priceTitle]}>월간 ₩2,900</Text>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            loading={busy === 'monthly'}
            disabled={!!busy}
            onPress={() => handleBuy('monthly')}
            style={{ marginTop: spacing.xs }}
          >
            월간 구독하기
          </Button>
        </Card>

        <Text style={[typography.small, styles.disclaimer]}>
          정기결제는 토스 인앱 설정에서 언제든 해지할 수 있어요. 구독 기간 만료 전 해지 시 다음 결제일에 자동으로 종료돼요.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  heroEmoji: { fontSize: 48 },
  title: { color: colors.gray900, textAlign: 'center' },
  subtitle: { color: colors.gray600, textAlign: 'center' },
  benefits: { gap: spacing.xs },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray50,
  },
  benefitEmoji: { fontSize: 24 },
  benefitTitle: { color: colors.gray900 },
  benefitBody: { color: colors.gray600, marginTop: 2 },
  priceCard: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue100,
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing.xxs,
  },
  priceCardAlt: { gap: spacing.xxs },
  priceTitle: { color: colors.gray900 },
  disclaimer: { color: colors.gray500, textAlign: 'center', marginTop: spacing.sm },
});
