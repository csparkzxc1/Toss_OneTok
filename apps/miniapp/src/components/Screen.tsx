import type { ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, spacing } from '@/design/tokens';

interface Props {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  footer?: ReactNode;
}

export function Screen({ children, scroll = true, padded = true, style, footer }: Props) {
  const Container = scroll ? ScrollView : View;
  const innerProps = scroll ? { contentContainerStyle: padded ? styles.padded : undefined } : {};

  return (
    <SafeAreaView style={[styles.safe, style]}>
      <Container style={styles.flex} {...innerProps}>
        {!scroll && padded ? <View style={styles.padded}>{children}</View> : children}
      </Container>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: { flex: 1 },
  padded: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.background,
  },
});
