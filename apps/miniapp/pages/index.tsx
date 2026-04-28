import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@granite-js/react-native';
import { Button, Card, Screen } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useUsage } from '@/hooks/useUsage';
import { useUsageStore } from '@/stores/usageStore';
import { useComposeStore } from '@/stores/composeStore';

export default function HomePage() {
  const router = useRouter();
  const { ready } = useBootstrap();
  useUsage();
  const remaining = useUsageStore((s) => s.remaining);
  const isPremium = useUsageStore((s) => s.isPremium);
  const reset = useComposeStore((s) => s.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <Screen scroll padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[typography.display, styles.brand]}>한줄톡</Text>
          <Text style={[typography.body, styles.subtitle]}>
            막막한 메시지, 한 줄로 바로 보내요.
          </Text>
        </View>

        <Card elevated style={styles.usageCard}>
          <Text style={[typography.captionBold, styles.usageLabel]}>
            {isPremium ? '프리미엄' : '오늘 남은 무료 횟수'}
          </Text>
          <Text style={[typography.title1, styles.usageValue]}>
            {isPremium ? '무제한' : `${remaining}회`}
          </Text>
          {!isPremium && remaining === 0 ? (
            <Text style={[typography.caption, styles.usageHint]}>
              광고를 보거나 구독하면 더 사용할 수 있어요.
            </Text>
          ) : null}
        </Card>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() => router.push('/compose')}
          accessibilityLabel="새 메시지 만들기"
          disabled={!ready}
        >
          새 메시지 만들기
        </Button>

        <View style={styles.row}>
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/history')}
            accessibilityRole="button"
            accessibilityLabel="히스토리 보기"
          >
            <Text style={styles.quickEmoji}>📚</Text>
            <Text style={[typography.bodyBold, styles.quickTitle]}>히스토리</Text>
            <Text style={[typography.caption, styles.quickSub]}>최근 만든 메시지</Text>
          </Pressable>
          <Pressable
            style={styles.quickCard}
            onPress={() => router.push('/paywall')}
            accessibilityRole="button"
            accessibilityLabel="프리미엄 보기"
          >
            <Text style={styles.quickEmoji}>✨</Text>
            <Text style={[typography.bodyBold, styles.quickTitle]}>프리미엄</Text>
            <Text style={[typography.caption, styles.quickSub]}>무제한 + 고급 톤</Text>
          </Pressable>
        </View>

        <Card style={styles.tipCard}>
          <Text style={[typography.captionBold, styles.tipBadge]}>💡 팁</Text>
          <Text style={[typography.body, styles.tipBody]}>
            상황과 톤만 고르면 AI가 메시지 후보 3개를 만들어요. 필요한 후보를 골라 바로 복사하세요.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  header: { gap: spacing.xxs, marginBottom: spacing.xs },
  brand: { color: colors.gray900 },
  subtitle: { color: colors.gray600 },
  usageCard: {
    gap: spacing.xxs,
    backgroundColor: colors.blue50,
    borderColor: colors.blue100,
  },
  usageLabel: { color: colors.blue600 },
  usageValue: { color: colors.blue700 },
  usageHint: { color: colors.gray700, marginTop: spacing.xxs },
  row: { flexDirection: 'row', gap: spacing.sm },
  quickCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    gap: spacing.xxs,
  },
  quickEmoji: { fontSize: 24 },
  quickTitle: { color: colors.gray900 },
  quickSub: { color: colors.gray600 },
  tipCard: { backgroundColor: colors.gray50 },
  tipBadge: { color: colors.warning, marginBottom: spacing.xxs },
  tipBody: { color: colors.gray700 },
});
