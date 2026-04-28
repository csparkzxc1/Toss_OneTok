import { ApiError, startGame, submitGame } from '@/api/client';
import {
  ChosungDisplay,
  ComboBadge,
  KoreanInput,
  type KoreanInputHandle,
  Screen,
  TimerBar,
  useToast,
} from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { quickValidate } from '@/game/matcher';
// 게임 플레이 화면 — 30초, 한 화면 한 단어
import { useNavigation, useRouteParams } from '@/lib/router';
import { useGameStore } from '@/stores/gameStore';
import { useResultStore } from '@/stores/resultStore';
import { useSessionStore } from '@/stores/sessionStore';
import { triggerHaptic } from '@/toss/haptic';
import { setKeepScreenOn } from '@/toss/screen';
import type { GameMode, GameWordPublic } from '@choseong-run/shared';
import { CATEGORIES, type CategoryId } from '@choseong-run/words';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export default function PlayPage() {
  const nav = useNavigation();
  const params = useRouteParams<{ category?: CategoryId; mode?: GameMode }>();
  const toast = useToast();
  const inputRef = useRef<KoreanInputHandle>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deviceId = useSessionStore((s) => s.deviceId);
  const userId = useSessionStore((s) => s.userId);

  const game = useGameStore();
  const dispatch = useGameStore((s) => s.dispatch);
  const setSession = useGameStore((s) => s.setSession);
  const resetGame = useGameStore((s) => s.resetGame);

  const [bootError, setBootError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // shake/flash 애니메이션
  const shake = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  const startNewGame = useCallback(async () => {
    if (!deviceId) return;
    resetGame();
    try {
      const res = await startGame({
        deviceId,
        userId,
        mode: params.mode ?? 'normal',
        category: params.category,
      });
      setSession(res.sessionId, res.category, res.mode);
      const words: GameWordPublic[] = res.words;
      dispatch({ type: 'START', words, now: now() });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : '게임을 시작하지 못했어요.';
      setBootError(msg);
    }
  }, [deviceId, userId, params.category, params.mode, dispatch, resetGame, setSession]);

  // 마운트 시 게임 시작
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // 화면 항상 켜짐 / 해제
  useEffect(() => {
    setKeepScreenOn(true);
    return () => {
      setKeepScreenOn(false);
    };
  }, []);

  // tick 루프 (200ms 간격으로 충분, 진행바는 Reanimated 측에서 보간)
  useEffect(() => {
    if (game.status !== 'playing') {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }
    tickIntervalRef.current = setInterval(() => {
      dispatch({ type: 'TICK', now: now() });
    }, 200);
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [game.status, dispatch]);

  // flash 효과 처리: shake/flashOpacity → CLEAR_FLASH
  useEffect(() => {
    if (!game.flash) return;
    if (game.flash === 'wrong') {
      triggerHaptic('error');
      shake.value = withSequence(
        withTiming(-12, { duration: 50 }),
        withTiming(12, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
    } else if (game.flash === 'correct') {
      triggerHaptic('success');
    } else if (game.flash === 'comboBonus') {
      triggerHaptic('impact');
      flashOpacity.value = withSequence(
        withTiming(0.6, { duration: 120 }),
        withTiming(0, { duration: 250 }),
      );
    }
    const t = setTimeout(() => dispatch({ type: 'CLEAR_FLASH' }), 200);
    return () => clearTimeout(t);
  }, [game.flash, game.flashAt, dispatch, shake, flashOpacity]);

  // 게임 종료 시 서버에 제출
  useEffect(() => {
    if (game.status !== 'finished') return;
    if (!deviceId || !game.sessionId || !game.category) return;
    let cancelled = false;
    setSubmitting(true);
    (async () => {
      try {
        const result = await submitGame({
          sessionId: game.sessionId!,
          deviceId,
          userId,
          results: game.attempts.map((a) => ({
            wordId: a.wordId,
            input: a.input,
            timeMs: a.timeMs,
          })),
        });
        if (cancelled) return;
        useResultStore.getState().setResult(result, game.category!, game.mode);
        nav.replace('result');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : '결과 전송에 실패했어요.';
        toast.show(msg);
        setSubmitting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    game.status,
    deviceId,
    userId,
    game.sessionId,
    game.category,
    game.mode,
    game.attempts,
    nav,
    toast,
  ]);

  const word = game.words[game.currentIndex];

  const handleSubmit = (raw: string) => {
    if (game.status !== 'playing' || !word) return;
    const validation = quickValidate(raw, word.length);
    // length_mismatch나 non_korean도 일단 제출 시도 (서버가 정답 체크)
    // → 다만 너무 빠른 노이즈 입력은 차단
    if (validation.reason === 'empty') {
      // 입력이 비어있으면 SKIP 처리
      dispatch({ type: 'SKIP', now: now() });
      return;
    }
    // 클라 측 정답 여부는 알 수 없음 (정답이 클라에 없음).
    // 서버가 채점하지만, 클라 표시용으로는 길이 + 한글 여부만으로 "정답 가능성"으로 다룸.
    // 게임 진행은 항상 다음 단어로 넘어가게 → "정답이라고 가정" + 서버에서 최종 판단
    // 단, 길이 불일치/비한글은 명백한 오답으로 처리.
    const looksCorrect = validation.ok;
    dispatch({ type: 'SUBMIT', input: raw, correct: looksCorrect, now: now() });
  };

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  if (bootError) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>{bootError}</Text>
          <Pressable onPress={() => nav.replace('index')} style={styles.errorBack}>
            <Text style={styles.errorBackText}>홈으로</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (game.status === 'idle' || game.words.length === 0 || submitting) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.loading}>{submitting ? '결과 정리 중...' : '게임 준비 중...'}</Text>
        </View>
      </Screen>
    );
  }

  const cat = CATEGORIES.find((c) => c.id === game.category);

  return (
    <Screen>
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      <View style={styles.header}>
        <Text style={styles.category}>
          {cat?.icon} {cat?.label}
        </Text>
        <Text style={styles.score}>{game.scoreClient.toLocaleString('ko-KR')}점</Text>
      </View>

      <View style={styles.timerWrap}>
        <TimerBar remainingMs={game.remainingMs} />
        <Text style={styles.timerText}>{(game.remainingMs / 1000).toFixed(1)}초</Text>
      </View>

      <ComboBadge combo={game.combo} />

      <Animated.View style={[styles.body, shakeStyle]}>
        {word ? (
          <>
            <ChosungDisplay chosung={word.chosung} length={word.length} />
            <Text style={styles.hint}>💡 {word.hint}</Text>
          </>
        ) : null}
      </Animated.View>

      <KoreanInput
        ref={inputRef}
        placeholder="한글로 입력 후 엔터"
        onSubmitText={handleSubmit}
        autoFocus
      />

      <Pressable
        onPress={() => dispatch({ type: 'SKIP', now: now() })}
        style={styles.skipButton}
        accessibilityRole="button"
        accessibilityLabel="이 문제 넘기기"
      >
        <Text style={styles.skipText}>이 문제 넘기기</Text>
      </Pressable>

      <View style={styles.progress}>
        <Text style={styles.progressText}>
          {game.currentIndex + 1} / {game.words.length}
        </Text>
      </View>
    </Screen>
  );
}

function now(): number {
  // RN 환경에서 performance.now는 일부 환경 미지원 → Date.now fallback.
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

const styles = StyleSheet.create({
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFD66B',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  category: { ...typography.bodyBold, color: colors.gray700 },
  score: { ...typography.title2, color: colors.blue500 },
  timerWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  timerText: {
    ...typography.captionBold,
    textAlign: 'right',
    color: colors.gray600,
  },
  body: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  hint: {
    ...typography.body,
    color: colors.gray600,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  skipButton: {
    alignSelf: 'center',
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  skipText: { color: colors.gray500, ...typography.caption },
  progress: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  progressText: { ...typography.caption, color: colors.gray400 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  loading: { ...typography.body, color: colors.gray600 },
  errorText: { ...typography.body, color: colors.danger, textAlign: 'center' },
  errorBack: { padding: spacing.md, backgroundColor: colors.blue500, borderRadius: radius.md },
  errorBackText: { color: colors.white, ...typography.bodyBold },
});
