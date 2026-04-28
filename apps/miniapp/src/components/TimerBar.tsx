import { colors, radius } from '@/design/tokens';
import { GAME_DURATION_MS } from '@choseong-run/shared';
// 게임 진행 바 — 60fps 매끄럽게.
// Reanimated의 useSharedValue + useAnimatedStyle로 JS 스레드 우회.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface Props {
  remainingMs: number;
  totalMs?: number; // 기본 30초
}

export function TimerBar({ remainingMs, totalMs = GAME_DURATION_MS }: Props) {
  const progress = useSharedValue(1);

  useEffect(() => {
    const ratio = Math.max(0, Math.min(1, remainingMs / totalMs));
    progress.value = withTiming(ratio, { duration: 250 });
  }, [remainingMs, totalMs, progress]);

  const isDanger = remainingMs <= 5_000 && remainingMs > 0;

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={styles.track}
      accessibilityLabel={`남은 시간 ${(remainingMs / 1000).toFixed(1)}초`}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: isDanger ? colors.danger : colors.blue500 },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.gray100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
