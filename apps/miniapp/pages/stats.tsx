import { Button, Card, Screen } from '@/components';
import { colors, spacing, typography } from '@/design/tokens';
// 통계 화면 (프리미엄) — 로컬에 누적된 게임 결과 표시
import { useNavigation } from '@/lib/router';
import { useUsageStore } from '@/stores/usageStore';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// 단순 표시용. 실제 통계 데이터는 추후 서버 API로 추가.
export default function StatsPage() {
  const nav = useNavigation();
  const isPremium = useUsageStore((s) => s.isPremium);

  if (!isPremium) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.lock}>🔒</Text>
          <Text style={styles.title}>통계는 프리미엄 전용이에요</Text>
          <Button onPress={() => nav.replace('paywall')}>프리미엄 보러가기</Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>나의 통계</Text>
        <Card>
          <Text style={styles.placeholderTitle}>곧 만나요!</Text>
          <Text style={styles.placeholderBody}>
            카테고리별 평균 점수, 최고 콤보 추이, 자주 틀린 패턴 분석을 준비하고 있어요.
          </Text>
        </Card>
        <Button variant="ghost" onPress={() => nav.replace('index')}>
          홈으로
        </Button>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  title: { ...typography.title1, color: colors.gray900 },
  placeholderTitle: { ...typography.title2, color: colors.gray800 },
  placeholderBody: { ...typography.body, color: colors.gray600, marginTop: spacing.xs },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  lock: { fontSize: 48 },
});
