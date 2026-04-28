import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@granite-js/react-native';
import { Button, Card, Screen, useToast } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { useGenerate } from '@/hooks/useGenerate';
import { useComposeStore } from '@/stores/composeStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUsageStore } from '@/stores/usageStore';
import { copyText } from '@/toss/clipboard';
import { showRewardedAd } from '@/toss/ad';
import { claimAdBonus } from '@/api/client';

export default function ResultPage() {
  const router = useRouter();
  const toast = useToast();
  const { situation, tone, context, candidates, setCandidates } = useComposeStore();
  const deviceId = useSessionStore((s) => s.deviceId);
  const userId = useSessionStore((s) => s.userId);
  const remaining = useUsageStore((s) => s.remaining);
  const bonusRemaining = useUsageStore((s) => s.bonusRemaining);
  const isPremium = useUsageStore((s) => s.isPremium);
  const setUsage = useUsageStore((s) => s.set);

  const generate = useGenerate();
  const [adLoading, setAdLoading] = useState(false);

  const exhausted = !isPremium && remaining === 0;

  async function handleCopy(text: string) {
    const ok = await copyText(text);
    toast.show(ok ? '복사했어요' : '복사 실패', ok ? 'success' : 'danger');
  }

  async function handleRegenerate() {
    if (!situation || !tone || !deviceId) return;
    if (exhausted) {
      toast.show('사용량을 먼저 채워주세요', 'default');
      return;
    }
    try {
      const res = await generate.mutateAsync({
        situation,
        tone,
        context,
        deviceId,
        userId,
      });
      setCandidates(res.candidates);
    } catch (err) {
      const message = err instanceof Error ? err.message : '다시 생성하지 못했어요.';
      toast.show(message, 'danger');
    }
  }

  async function handleWatchAd() {
    if (!deviceId) return;
    if (bonusRemaining === 0) {
      toast.show('오늘 광고 보상을 모두 받으셨어요', 'default');
      return;
    }
    setAdLoading(true);
    try {
      const ad = await showRewardedAd();
      if (!ad.ok || !ad.adToken) {
        toast.show('광고를 끝까지 보지 못했어요', 'default');
        return;
      }
      await claimAdBonus({ deviceId, userId, adToken: ad.adToken });
      setUsage({ remaining: remaining + 1, bonusRemaining: Math.max(0, bonusRemaining - 1) });
      toast.show('+1회 충전됐어요', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : '보상 처리에 실패했어요.';
      toast.show(message, 'danger');
    } finally {
      setAdLoading(false);
    }
  }

  if (!candidates || !situation || !tone) {
    // 직접 진입한 경우 홈으로
    return (
      <Screen>
        <Text style={[typography.title2, { color: colors.gray800 }]}>생성된 메시지가 없어요</Text>
        <Button variant="primary" onPress={() => router.replace('/')}>
          홈으로
        </Button>
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[typography.title1, styles.heading]}>이런 메시지 어때요?</Text>
        <Text style={[typography.caption, styles.subhead]}>
          마음에 드는 후보를 골라 바로 복사할 수 있어요.
        </Text>

        {generate.isPending ? <SkeletonList /> : null}

        {!generate.isPending &&
          candidates.map((c, idx) => (
            <Card elevated key={`${idx}-${c.slice(0, 10)}`} style={styles.candidate}>
              <View style={styles.numberRow}>
                <Text style={styles.number}>후보 {idx + 1}</Text>
              </View>
              <Text style={[typography.body, styles.candidateText]}>{c}</Text>
              <View style={styles.actions}>
                <Pressable
                  onPress={() => handleCopy(c)}
                  style={({ pressed }) => [
                    styles.copyBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`후보 ${idx + 1} 복사`}
                >
                  <Text style={[typography.bodyBold, styles.copyText]}>📋 복사</Text>
                </Pressable>
              </View>
            </Card>
          ))}

        <View style={styles.controls}>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            loading={generate.isPending}
            disabled={exhausted || generate.isPending}
            onPress={handleRegenerate}
          >
            🔄 이 톤으로 다시 만들기
          </Button>
        </View>

        {exhausted ? (
          <Card style={styles.exhausted}>
            <Text style={[typography.title2, { color: colors.gray900 }]}>
              오늘은 다 썼어요
            </Text>
            <Text style={[typography.caption, { color: colors.gray600 }]}>
              광고를 보면 +1회, 프리미엄을 구독하면 무제한이에요.
            </Text>
            <Button
              variant="primary"
              size="md"
              fullWidth
              loading={adLoading}
              disabled={bonusRemaining === 0}
              onPress={handleWatchAd}
            >
              {bonusRemaining > 0
                ? `광고 보고 +1회 받기 (오늘 ${bonusRemaining}회 남음)`
                : '오늘 광고 보상 모두 받음'}
            </Button>
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => router.push('/paywall')}
            >
              무제한으로 사용하기
            </Button>
          </Card>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function SkeletonList() {
  return (
    <View style={{ gap: spacing.sm }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeleton}>
          <View style={[styles.shimmer, { width: '60%' }]} />
          <View style={[styles.shimmer, { width: '90%' }]} />
          <View style={[styles.shimmer, { width: '75%' }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  heading: { color: colors.gray900 },
  subhead: { color: colors.gray600, marginBottom: spacing.xs },
  candidate: { gap: spacing.xs },
  numberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  number: { color: colors.blue600, ...typography.captionBold },
  candidateText: { color: colors.gray900, lineHeight: 24 },
  actions: { flexDirection: 'row', gap: spacing.xs, justifyContent: 'flex-end' },
  copyBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.blue50,
    minHeight: 36,
    justifyContent: 'center',
  },
  copyText: { color: colors.blue600 },
  controls: { marginTop: spacing.sm },
  exhausted: {
    backgroundColor: colors.gray50,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  skeleton: {
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  shimmer: {
    height: 14,
    backgroundColor: colors.gray200,
    borderRadius: radius.sm,
  },
});
