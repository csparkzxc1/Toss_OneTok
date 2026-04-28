import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '@/design/tokens';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <View style={styles.container}>
            <Text style={styles.emoji}>😵</Text>
            <Text style={[typography.title2, styles.title]}>앗, 문제가 생겼어요</Text>
            <Text style={[typography.body, styles.body]}>
              앱을 다시 실행해 주세요. 같은 문제가 반복되면 메인 화면에서 새로고침해 주세요.
            </Text>
          </View>
        )
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emoji: { fontSize: 48 },
  title: { color: colors.gray900 },
  body: { color: colors.gray600, textAlign: 'center' },
});
