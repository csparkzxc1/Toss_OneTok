import { colors, radius, spacing } from '@/design/tokens';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  combo: number;
}

function comboColor(combo: number): string {
  if (combo >= 10) return '#FF6B6B';
  if (combo >= 5) return '#FBBF24';
  if (combo >= 3) return '#FFD66B';
  return colors.gray700;
}

export function ComboBadge({ combo }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (combo > 0) {
      scale.value = withSequence(
        withTiming(1.25, { duration: 120 }),
        withSpring(1, { damping: 6, stiffness: 200 }),
      );
    }
  }, [combo, scale]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (combo <= 0) {
    return <View style={styles.placeholder} />;
  }

  return (
    <Animated.View style={[styles.badge, { backgroundColor: comboColor(combo) }, animStyle]}>
      <Text style={styles.text}>🔥 {combo} COMBO</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  placeholder: { height: 32 },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  text: {
    color: '#1F1208',
    fontSize: 14,
    fontWeight: '800',
  },
});
