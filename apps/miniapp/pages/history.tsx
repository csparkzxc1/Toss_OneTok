import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from '@granite-js/react-native';
import { Button, Card, Screen } from '@/components';
import { colors, spacing, typography } from '@/design/tokens';
import { useUsageStore } from '@/stores/usageStore';

export default function HistoryPage() {
  const router = useRouter();
  const isPremium = useUsageStore((s) => s.isPremium);

  if (!isPremium) {
    return (
      <Screen>
        <View style={styles.gate}>
          <Text style={styles.emoji}>🔒</Text>
          <Text style={[typography.title1, styles.title]}>히스토리는 프리미엄 기능이에요</Text>
          <Text style={[typography.body, styles.body]}>
            프리미엄을 구독하면 만든 메시지를 모두 모아 다시 볼 수 있어요.
          </Text>
          <Button variant="primary" size="lg" fullWidth onPress={() => router.push('/paywall')}>
            프리미엄 보기
          </Button>
        </View>
      </Screen>
    );
  }

  // TODO: 실제 히스토리는 백엔드 GET /api/generations 추가 후 연결
  return (
    <Screen scroll padded>
      <Text style={[typography.title1, { color: colors.gray900 }]}>히스토리</Text>
      <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
        <Card>
          <Text style={[typography.body, { color: colors.gray600 }]}>
            아직 생성한 메시지가 없어요. 새 메시지를 만들어보세요.
          </Text>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emoji: { fontSize: 48 },
  title: { color: colors.gray900, textAlign: 'center' },
  body: { color: colors.gray600, textAlign: 'center' },
});
