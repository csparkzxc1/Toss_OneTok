import { getDailyToday } from '@/api/client';
import { Button, Card, Screen, useToast } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
// 일일 챌린지 화면 — 카테고리 안내 + 시작 버튼
import { useNavigation } from '@/lib/router';
import { useSessionStore } from '@/stores/sessionStore';
import { CATEGORIES } from '@choseong-run/words';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';

export default function DailyPage() {
  const nav = useNavigation();
  const toast = useToast();
  const deviceId = useSessionStore((s) => s.deviceId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['daily-today', deviceId],
    queryFn: () => getDailyToday(deviceId!),
    enabled: !!deviceId,
  });

  const cat = data ? CATEGORIES.find((c) => c.id === data.category) : undefined;

  const handleStart = () => {
    if (!data) return;
    if (data.played && !data.reviveAvailable) {
      toast.show('오늘은 이미 도전했어요. 내일 또 만나요!');
      return;
    }
    nav.push('play', { mode: 'daily', category: data.category });
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>오늘의 일일 챌린지</Text>
        <Text style={styles.subtitle}>모두 같은 30문제, 오늘만 가능</Text>

        {isLoading ? <Text style={styles.loading}>불러오는 중...</Text> : null}
        {error ? <Text style={styles.error}>일일 챌린지 정보를 가져오지 못했어요.</Text> : null}

        {data ? (
          <Card style={styles.card}>
            <Text style={styles.dateText}>{data.date}</Text>
            <Text style={styles.catEmoji}>{cat?.icon ?? '🎯'}</Text>
            <Text style={styles.catLabel}>{cat?.label ?? data.category}</Text>
            <Text style={styles.body}>
              {data.played
                ? data.reviveAvailable
                  ? '광고를 보고 한 번 더 도전할 수 있어요.'
                  : '오늘은 이미 도전을 완료했어요.'
                : '아직 도전하지 않았어요. 30초 안에 최대한 많이 맞혀보세요!'}
            </Text>
          </Card>
        ) : null}

        <Button
          fullWidth
          size="lg"
          disabled={!data || (data.played && !data.reviveAvailable)}
          onPress={handleStart}
        >
          {data?.played
            ? data.reviveAvailable
              ? '광고 보고 한 번 더 도전'
              : '내일 다시 만나요'
            : '도전 시작'}
        </Button>

        <Button variant="ghost" fullWidth onPress={() => nav.push('leaderboard')}>
          오늘의 랭킹 보기
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  title: { ...typography.title1, color: colors.gray900 },
  subtitle: { ...typography.body, color: colors.gray600 },
  loading: { ...typography.body, color: colors.gray500 },
  error: { ...typography.body, color: colors.danger },
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.blue50,
    borderRadius: radius.xl,
  },
  dateText: { ...typography.captionBold, color: colors.blue700 },
  catEmoji: { fontSize: 64 },
  catLabel: { ...typography.title1, color: colors.gray900 },
  body: {
    ...typography.body,
    color: colors.gray700,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
});
