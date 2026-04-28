import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from '@granite-js/react-native';
import {
  CONTEXT_MAX_LENGTH,
  FREE_TONES,
  PREMIUM_TONES,
  SITUATION_ICON,
  SITUATION_LABEL,
  TONE_LABEL,
  type Situation,
  type Tone,
} from '@hanjul-tok/shared';
import { Button, Chip, Screen, useToast } from '@/components';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { useGenerate } from '@/hooks/useGenerate';
import { useComposeStore } from '@/stores/composeStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUsageStore } from '@/stores/usageStore';
import { triggerHaptic } from '@/toss/haptic';

const SITUATIONS: Situation[] = [
  'reject',
  'apology',
  'request',
  'thanks',
  'congrats',
  'condolence',
  'introduce',
  'reply',
  'breakup',
  'reconcile',
  'announce',
  'etc',
];

export default function ComposePage() {
  const router = useRouter();
  const toast = useToast();
  const deviceId = useSessionStore((s) => s.deviceId);
  const userId = useSessionStore((s) => s.userId);
  const isPremium = useUsageStore((s) => s.isPremium);
  const remaining = useUsageStore((s) => s.remaining);
  const setCandidates = useComposeStore((s) => s.setCandidates);
  const storeSetSituation = useComposeStore((s) => s.setSituation);
  const storeSetTone = useComposeStore((s) => s.setTone);
  const storeSetContext = useComposeStore((s) => s.setContext);

  const [situation, setSituation] = useState<Situation | null>(null);
  const [tone, setTone] = useState<Tone | null>(null);
  const [context, setContext] = useState('');

  const generate = useGenerate();

  const canSubmit = useMemo(
    () => !!situation && !!tone && context.trim().length > 0 && !!deviceId,
    [situation, tone, context, deviceId],
  );

  function handleSelectSituation(s: Situation) {
    triggerHaptic('selection');
    setSituation(s);
  }

  function handleSelectTone(t: Tone) {
    if (!isPremium && (PREMIUM_TONES as readonly string[]).includes(t)) {
      toast.show('이 톤은 프리미엄 전용이에요', 'default');
      router.push('/paywall');
      return;
    }
    triggerHaptic('selection');
    setTone(t);
  }

  async function handleSubmit() {
    if (!canSubmit || !situation || !tone || !deviceId) return;
    if (!isPremium && remaining === 0) {
      toast.show('오늘 사용량을 다 썼어요', 'default');
      router.push('/result'); // result 화면에서 광고/결제 유도
      return;
    }

    storeSetSituation(situation);
    storeSetTone(tone);
    storeSetContext(context.trim());

    try {
      const res = await generate.mutateAsync({
        situation,
        tone,
        context: context.trim(),
        deviceId,
        userId,
      });
      setCandidates(res.candidates);
      router.push('/result');
    } catch (err) {
      const message = err instanceof Error ? err.message : '메시지 생성에 실패했어요.';
      toast.show(message, 'danger');
    }
  }

  return (
    <Screen
      scroll={false}
      padded={false}
      footer={
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={generate.isPending}
          disabled={!canSubmit}
          onPress={handleSubmit}
          accessibilityLabel="메시지 만들기"
        >
          메시지 만들기
        </Button>
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[typography.title1, styles.heading]}>어떤 상황이에요?</Text>
          <View style={styles.grid}>
            {SITUATIONS.map((s) => {
              const selected = s === situation;
              return (
                <Pressable
                  key={s}
                  onPress={() => handleSelectSituation(s)}
                  style={[styles.cell, selected && styles.cellSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${SITUATION_LABEL[s]} 상황`}
                >
                  <Text style={styles.cellEmoji}>{SITUATION_ICON[s]}</Text>
                  <Text
                    style={[
                      typography.captionBold,
                      selected ? styles.cellLabelSelected : styles.cellLabel,
                    ]}
                  >
                    {SITUATION_LABEL[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[typography.title1, styles.heading]}>톤은?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toneRow}
          >
            {[...FREE_TONES].map((t) => (
              <Chip
                key={t}
                label={TONE_LABEL[t]}
                selected={t === tone}
                onPress={() => handleSelectTone(t)}
              />
            ))}
            {[...PREMIUM_TONES].map((t) => (
              <Chip
                key={t}
                label={TONE_LABEL[t]}
                badge="✨"
                selected={t === tone}
                onPress={() => handleSelectTone(t)}
              />
            ))}
          </ScrollView>

          <Text style={[typography.title1, styles.heading]}>한 줄로 알려주세요</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={context}
              onChangeText={(text) => setContext(text.slice(0, CONTEXT_MAX_LENGTH))}
              placeholder="예: 친한 선배 결혼식인데 일정 안돼서 못 감"
              placeholderTextColor={colors.gray400}
              multiline
              style={styles.textarea}
              accessibilityLabel="메시지 컨텍스트 입력"
            />
            <Text style={styles.counter}>
              {context.length}/{CONTEXT_MAX_LENGTH}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  heading: { color: colors.gray900, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  cellSelected: {
    backgroundColor: colors.blue50,
    borderColor: colors.blue500,
  },
  cellEmoji: { fontSize: 28 },
  cellLabel: { color: colors.gray700 },
  cellLabelSelected: { color: colors.blue700 },
  toneRow: { gap: spacing.xs, paddingRight: spacing.lg },
  inputWrap: {
    backgroundColor: colors.gray50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gray100,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.gray900,
    ...typography.body,
  },
  counter: {
    alignSelf: 'flex-end',
    color: colors.gray500,
    ...typography.small,
  },
});
