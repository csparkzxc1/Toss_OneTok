import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/design/tokens';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  badge?: string;
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, disabled, badge, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipDefault,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text
        style={[
          typography.captionBold,
          selected ? styles.textSelected : styles.textDefault,
          disabled && styles.textDisabled,
        ]}
      >
        {label}
      </Text>
      {badge ? <Text style={styles.badge}>{badge}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    minHeight: 36,
    borderWidth: 1,
  },
  chipDefault: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
  },
  chipSelected: {
    backgroundColor: colors.blue500,
    borderColor: colors.blue500,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  pressed: { opacity: 0.85 },
  textDefault: { color: colors.gray700 },
  textSelected: { color: colors.white },
  textDisabled: { color: colors.gray500 },
  badge: {
    marginLeft: spacing.xxs,
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
});
