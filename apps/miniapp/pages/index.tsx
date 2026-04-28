import { syncAuth } from '@/api/client';
import { Button, Card, Screen, useToast } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { useBootstrap } from '@/hooks/useBootstrap';
import { useUsage } from '@/hooks/useUsage';
// 홈 화면 — 카테고리 선택 + 일일 챌린지 + 랭킹 진입
import { useNavigation } from '@/lib/router';
import { useSessionStore } from '@/stores/sessionStore';
import { useUsageStore } from '@/stores/usageStore';
import { loginWithToss } from '@/toss/auth';
import { CATEGORIES, type CategoryId } from '@choseong-run/words';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomePage() {
  const nav = useNavigation();
  const toast = useToast();
  useBootstrap();
  useUsage();

  const remaining = useUsageStore((s) => s.remaining);
  const isPremium = useUsageStore((s) => s.isPremium);
  const tossUserKey = useSessionStore((s) => s.tossUserKey);

  const [selected, setSelected] = useState<CategoryId>('food');

  const handleStart = (category: CategoryId) => {
    if (!isPremium && remaining <= 0) {
      toast.show('오늘 무료 게임을 다 썼어요. 광고 보고 +1 받거나 프리미엄을 이용해보세요.');
      return;
    }
    nav.push('play', { category, mode: 'normal' });
  };

  const handleLogin = async () => {
    const user = await loginWithToss();
    if (!user) {
      toast.show('로그인이 취소됐어요.');
      return;
    }
    try {
      const { userId } = await syncAuth(user.tossUserKey);
      useSessionStore.getState().setUser({ userId, tossUserKey: user.tossUserKey });
      toast.show('로그인 완료! 무료 게임이 5회로 늘었어요.');
    } catch {
      toast.show('로그인 처리에 실패했어요.');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.brand}>초성런</Text>
          <Text style={styles.tagline}>30초, 초성으로 단어 맞히기</Text>
        </View>

        <Card style={styles.usageCard}>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>오늘 남은 게임</Text>
            <Text style={styles.usageCount}>{isPremium ? '무제한' : `${remaining}회`}</Text>
          </View>
          {!tossUserKey ? (
            <Button variant="secondary" size="sm" onPress={handleLogin}>
              토스 로그인하고 +2회 받기
            </Button>
          ) : null}
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>오늘의 챌린지</Text>
          <Pressable
            onPress={() => nav.push('daily')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.dailyCard, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.dailyEmoji}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyTitle}>일일 챌린지</Text>
              <Text style={styles.dailySub}>모두 같은 30문제, 오늘의 랭킹에 도전</Text>
            </View>
            <Text style={styles.dailyChevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리 선택</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => {
              const isLocked = cat.premium && !isPremium;
              const isSelected = cat.id === selected;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    if (isLocked) {
                      nav.push('paywall');
                      return;
                    }
                    setSelected(cat.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`카테고리 ${cat.label}${isLocked ? ' 잠김' : ''}`}
                  style={({ pressed }) => [
                    styles.gridItem,
                    isSelected && styles.gridItemSelected,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={styles.gridEmoji}>{cat.icon}</Text>
                  <Text style={styles.gridLabel}>{cat.label}</Text>
                  {isLocked ? <Text style={styles.lockBadge}>🔒</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Button fullWidth size="lg" onPress={() => handleStart(selected)}>
          {`'${categoryLabel(selected)}'로 시작하기`}
        </Button>

        <Pressable onPress={() => nav.push('leaderboard')} style={styles.linkRow}>
          <Text style={styles.link}>오늘의 랭킹 보기 →</Text>
        </Pressable>

        {isPremium ? (
          <Pressable onPress={() => nav.push('stats')} style={styles.linkRow}>
            <Text style={styles.link}>나의 통계 보기 →</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => nav.push('paywall')} style={styles.linkRow}>
            <Text style={styles.link}>프리미엄으로 광고 없이 무제한 →</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

function categoryLabel(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? '음식';
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.md, gap: spacing.md },
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  brand: { ...typography.display, color: colors.blue500 },
  tagline: { ...typography.body, color: colors.gray600, marginTop: spacing.xs },
  usageCard: { flexDirection: 'column', gap: spacing.sm },
  usageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  usageLabel: { ...typography.body, color: colors.gray700 },
  usageCount: { ...typography.title2, color: colors.blue500 },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.title2, color: colors.gray800 },
  dailyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.blue500,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  dailyEmoji: { fontSize: 36 },
  dailyTitle: { color: colors.white, ...typography.bodyBold, fontSize: 16 },
  dailySub: { color: colors.blue50, ...typography.caption },
  dailyChevron: { color: colors.white, fontSize: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridItem: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: { borderColor: colors.blue500, backgroundColor: colors.blue50 },
  gridEmoji: { fontSize: 32 },
  gridLabel: { ...typography.captionBold, color: colors.gray800 },
  lockBadge: { position: 'absolute', top: 8, right: 8, fontSize: 16 },
  linkRow: { paddingVertical: spacing.sm, alignItems: 'center' },
  link: { color: colors.blue500, ...typography.bodyBold },
});
