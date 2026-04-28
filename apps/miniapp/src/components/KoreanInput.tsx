import { colors, radius, spacing } from '@/design/tokens';
// 한글 입력 컴포넌트.
// 함정:
// - iOS: onChangeText는 조합 완료 후에만 옴 (단, 인풋 버퍼는 조합 중)
// - Android: 조합 중도 onChangeText 발생 → 매 자모 단위로 호출됨
// - controlled value로 강제하면 한글이 깨질 수 있음 → uncontrolled + ref 패턴 권장
//
// 전략: 입력은 자유롭게 받고, 부모는 onChangeText로 현재 값을 받는다.
// 제출은 onSubmitEditing(엔터/완료) 또는 외부 트리거로 호출 → ref.current.value 읽기.
// 매 입력마다 부모에서 매칭 시도하지 않고, 부모는 디바운스 또는 명시적 제출 시점만 본다.
import { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  type NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  type TextInputSubmitEditingEventData,
  View,
} from 'react-native';

export interface KoreanInputHandle {
  getValue: () => string;
  clear: () => void;
  focus: () => void;
}

interface Props {
  placeholder?: string;
  onSubmitText: (value: string) => void;
  onChangeText?: (value: string) => void;
  autoFocus?: boolean;
  editable?: boolean;
}

export const KoreanInput = forwardRef<KoreanInputHandle, Props>(function KoreanInput(
  { placeholder, onSubmitText, onChangeText, autoFocus = true, editable = true },
  ref,
) {
  const inputRef = useRef<TextInput>(null);
  const valueRef = useRef('');

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => valueRef.current,
      clear: () => {
        valueRef.current = '';
        inputRef.current?.clear();
      },
      focus: () => inputRef.current?.focus(),
    }),
    [],
  );

  const handleChange = (text: string) => {
    valueRef.current = text;
    onChangeText?.(text);
  };

  const handleSubmit = (_: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    const v = valueRef.current;
    onSubmitText(v);
    valueRef.current = '';
    inputRef.current?.clear();
  };

  return (
    <View style={styles.wrap}>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder ?? '단어를 입력하세요'}
        placeholderTextColor={colors.gray400}
        autoFocus={autoFocus}
        editable={editable}
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="default"
        returnKeyType="done"
        onChangeText={handleChange}
        onSubmitEditing={handleSubmit}
        blurOnSubmit={false} // 다음 단어를 바로 입력할 수 있게 포커스 유지
        // RN 한글 IME: controlled value 사용 금지. defaultValue도 의미 없으니 생략.
        accessibilityLabel="정답 입력 칸"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
  },
  input: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.blue100,
    paddingHorizontal: spacing.md,
    fontSize: 24,
    color: colors.gray900,
    textAlign: 'center',
    fontWeight: '700',
  },
});
