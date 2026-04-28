import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '@/design/tokens';

interface ToastState {
  message: string;
  variant: 'default' | 'success' | 'danger';
}

interface ToastContextValue {
  show: (message: string, variant?: ToastState['variant']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const show = useCallback<ToastContextValue['show']>(
    (message, variant = 'default') => {
      setToast({ message, variant });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1600),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [toast, opacity]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.toast, toastVariantStyle(toast.variant), { opacity }]}
        >
          <Text style={[typography.bodyBold, styles.toastText]}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function toastVariantStyle(variant: ToastState['variant']) {
  switch (variant) {
    case 'success':
      return { backgroundColor: colors.success };
    case 'danger':
      return { backgroundColor: colors.danger };
    default:
      return { backgroundColor: colors.gray800 };
  }
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 80,
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  toastText: { color: colors.white },
});
