import { getLeaderboard } from '@/api/client';
import { Card, Screen } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
// 일일 랭킹 화면
import { useNavigation } from '@/lib/router';
import { useSessionStore } from '@/stores/sessionStore';
import { useQuery } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

function todayKstYmd(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function LeaderboardPage() {
  const nav = useNavigation();
  const deviceId = useSessionStore((s) => s.deviceId);
  const today = todayKstYmd();

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', today, deviceId],
    queryFn: () => getLeaderboard(today, deviceId),
  });
  void nav;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>오늘의 랭킹</Text>
        <Text style={styles.subtitle}>{today}</Text>

        {data?.myRank ? (
          <Card style={styles.myCard}>
            <Text style={styles.myLabel}>내 순위</Text>
            <Text style={styles.myRank}>
              {data.myRank}위 · {(data.myScore ?? 0).toLocaleString('ko-KR')}점
            </Text>
          </Card>
        ) : null}

        {isLoading ? <Text style={styles.loading}>불러오는 중...</Text> : null}

        <View style={styles.list}>
          {(data?.entries ?? []).map((e) => (
            <View key={`${e.rank}-${e.displayName}`} style={[styles.row, e.isMe && styles.rowMe]}>
              <Text style={styles.rank}>{e.rank}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {e.displayName}
                {e.isMe ? ' (나)' : ''}
              </Text>
              <Text style={styles.score}>{e.score.toLocaleString('ko-KR')}</Text>
            </View>
          ))}
          {!isLoading && (data?.entries ?? []).length === 0 ? (
            <Text style={styles.empty}>아직 도전한 사람이 없어요. 1등의 주인공이 되어보세요!</Text>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  title: { ...typography.title1, color: colors.gray900 },
  subtitle: { ...typography.caption, color: colors.gray500 },
  myCard: {
    backgroundColor: colors.blue500,
  },
  myLabel: { color: colors.blue50, ...typography.caption },
  myRank: { color: colors.white, ...typography.title2, marginTop: spacing.xs },
  loading: { ...typography.body, color: colors.gray500 },
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  rowMe: { backgroundColor: colors.blue50 },
  rank: { width: 36, ...typography.bodyBold, color: colors.gray700 },
  name: { flex: 1, ...typography.body, color: colors.gray800 },
  score: { ...typography.bodyBold, color: colors.blue500 },
  empty: {
    ...typography.body,
    color: colors.gray500,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
