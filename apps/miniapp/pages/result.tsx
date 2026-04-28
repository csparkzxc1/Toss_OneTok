import { claimAdBonus } from '@/api/client';
import { Button, ResultCard, Screen, useToast } from '@/components';
import { colors, spacing, typography } from '@/design/tokens';
import { useNavigation } from '@/lib/router';
import { useGameStore } from '@/stores/gameStore';
import { useResultStore } from '@/stores/resultStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUsageStore } from '@/stores/usageStore';
import { showRewardedAd } from '@/toss/ad';
import { triggerHaptic } from '@/toss/haptic';
import { PROMOTION_IDS, grantPoints } from '@/toss/points';
// 결과 화면 — 점수 카운트업, 공유, 다시 시작, 광고 보너스
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ResultPage() {
  const nav = useNavigation();
  const toast = useToast();

  const result = useResultStore((s) => s.result);
  const category = useResultStore((s) => s.category);
  const mode = useResultStore((s) => s.mode);
  const totalAttempts = useGameStore((s) => s.attempts.length);

  const deviceId = useSessionStore((s) => s.deviceId);
  const userId = useSessionStore((s) => s.userId);
  const remaining = useUsageStore((s) => s.remaining);
  const bonusRemaining = useUsageStore((s) => s.bonusRemaining);
  const isPremium = useUsageStore((s) => s.isPremium);
  const setUsage = useUsageStore((s) => s.set);

  const [adLoading, setAdLoading] = useState(false);

  // 점수 카운트업
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!result) return;
    const target = result.totalScore;
    const duration = 1200;
    const startedAt = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplayScore(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    triggerHaptic('success');

    // 토스 포인트 자격 발생 시 클라에서 grant 호출 (서버가 자격 부여 → 클라가 사용자 동의 후 수령)
    if (result.pointsAwarded > 0) {
      grantPoints(PROMOTION_IDS.first_100.id).catch(() => {
        // 실패해도 결과 화면은 정상 표시
      });
    }
  }, [result]);

  if (!result || !category || !mode) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.empty}>표시할 결과가 없어요</Text>
          <Button onPress={() => nav.replace('index')}>홈으로</Button>
        </View>
      </Screen>
    );
  }

  const exhausted = !isPremium && remaining <= 0;

  const handleAgain = () => {
    if (exhausted) {
      toast.show('오늘 무료 게임을 다 썼어요. 광고를 보거나 프리미엄을 이용해보세요.');
      return;
    }
    nav.replace('play', { category, mode });
  };

  const handleAdBonus = async () => {
    if (!deviceId) return;
    if (bonusRemaining <= 0) {
      toast.show('오늘 광고 보상은 모두 받았어요.');
      return;
    }
    setAdLoading(true);
    try {
      const ad = await showRewardedAd();
      if (!ad.ok || !ad.adToken) {
        toast.show('광고를 끝까지 보지 못했어요.');
        return;
      }
      await claimAdBonus({ deviceId, userId, adToken: ad.adToken });
      setUsage({ remaining: remaining + 1, bonusRemaining: Math.max(0, bonusRemaining - 1) });
      toast.show('+1회 충전됐어요', 'success');
    } catch {
      toast.show('보상 처리에 실패했어요.');
    } finally {
      setAdLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.scoreHero}>
          <Text style={styles.scoreLabel}>최종 점수</Text>
          <Text style={styles.scoreValue}>{displayScore.toLocaleString('ko-KR')}</Text>
        </View>

        <ResultCard
          totalScore={result.totalScore}
          correctCount={result.correctCount}
          maxCombo={result.maxCombo}
          category={category}
          totalWords={totalAttempts || result.wordResults.length}
          dailyRank={result.dailyRank}
        />

        {result.pointsAwarded > 0 ? (
          <View style={styles.points}>
            <Text style={styles.pointsText}>🎁 토스 포인트 {result.pointsAwarded}P 적립!</Text>
          </View>
        ) : null}

        <View style={styles.buttons}>
          <Button fullWidth size="lg" onPress={handleAgain}>
            한 번 더
          </Button>
          {!isPremium && bonusRemaining > 0 ? (
            <Button variant="secondary" fullWidth loading={adLoading} onPress={handleAdBonus}>
              📺 광고 보고 +1게임 ({bonusRemaining}회 남음)
            </Button>
          ) : null}
          {mode === 'normal' ? (
            <Button variant="ghost" fullWidth onPress={() => nav.push('daily')}>
              일일 챌린지 도전하기
            </Button>
          ) : (
            <Button variant="ghost" fullWidth onPress={() => nav.push('leaderboard')}>
              오늘의 랭킹 보기
            </Button>
          )}
          <Button variant="ghost" fullWidth onPress={() => nav.replace('index')}>
            홈으로
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, gap: spacing.md },
  scoreHero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  scoreLabel: { ...typography.body, color: colors.gray500 },
  scoreValue: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.blue500,
    marginTop: spacing.xs,
  },
  points: {
    alignSelf: 'center',
    backgroundColor: colors.blue50,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  pointsText: { ...typography.bodyBold, color: colors.blue700 },
  buttons: { gap: spacing.sm, marginTop: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  empty: { ...typography.body, color: colors.gray600 },
});
