import { colors, radius, spacing } from '@/design/tokens';
import { CATEGORIES, type CategoryId } from '@choseong-run/words';
// 결과 화면 — 공유 카드용으로도 캡처 가능.
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  totalScore: number;
  correctCount: number;
  maxCombo: number;
  category: CategoryId;
  totalWords: number;
  dailyRank?: number | null;
}

function categoryMeta(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]!;
}

export function ResultCard({
  totalScore,
  correctCount,
  maxCombo,
  category,
  totalWords,
  dailyRank,
}: Props) {
  const meta = categoryMeta(category);
  const accuracy = totalWords > 0 ? Math.round((correctCount / totalWords) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.brand}>초성런</Text>
        <Text style={styles.category}>
          {meta.icon} {meta.label}
        </Text>
      </View>
      <View style={styles.scoreBlock}>
        <Text style={styles.scoreLabel}>최종 점수</Text>
        <Text style={styles.score}>{totalScore.toLocaleString('ko-KR')}</Text>
      </View>
      <View style={styles.statsRow}>
        <Stat label="정답" value={`${correctCount}개`} />
        <Stat label="정답률" value={`${accuracy}%`} />
        <Stat label="최고 콤보" value={`${maxCombo}`} />
      </View>
      {typeof dailyRank === 'number' ? (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>오늘의 챌린지 {dailyRank}위 🏆</Text>
        </View>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.blue500,
  },
  category: {
    fontSize: 14,
    color: colors.gray700,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  scoreLabel: {
    fontSize: 13,
    color: colors.gray500,
    marginBottom: spacing.xs,
  },
  score: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.gray900,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray50,
    borderRadius: radius.lg,
  },
  statCell: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  rankBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.blue50,
    borderRadius: radius.pill,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.blue700,
  },
});
