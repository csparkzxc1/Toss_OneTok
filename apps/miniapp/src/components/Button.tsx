import { colors, radius, spacing, typography } from '@/design/tokens';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  children,
  style,
  accessibilityLabel,
  ...rest
}: Props) {
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles(variant, isDisabled).container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles(variant, isDisabled).text.color} />
      ) : (
        <Text style={[typography.bodyBold, variantStyles(variant, isDisabled).text]}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    minHeight: 44, // a11y: 터치 타겟 44pt+
  },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
});

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, minHeight: 36 },
  md: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 44 },
  lg: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, minHeight: 52 },
};

function variantStyles(variant: Variant, disabled: boolean) {
  if (disabled) {
    return {
      container: { backgroundColor: colors.gray200 },
      text: { color: colors.gray500 },
    };
  }
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: colors.blue500 },
        text: { color: colors.white },
      };
    case 'secondary':
      return {
        container: { backgroundColor: colors.blue50 },
        text: { color: colors.blue500 },
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent' },
        text: { color: colors.gray700 },
      };
    case 'danger':
      return {
        container: { backgroundColor: colors.danger },
        text: { color: colors.white },
      };
  }
}
