// 토스 디자인 시스템 기반 토큰 (자체 정의, 콘솔 가이드 컬러 참고)
// 실제 토스 ADS는 외부 공개되지 않으므로 가까운 값으로 매핑

export const colors = {
  // Primary
  blue50: '#E6F0FF',
  blue100: '#BFD8FF',
  blue500: '#0064FF', // 토스 시그니처 블루
  blue600: '#0052CC',
  blue700: '#0040A0',

  // Neutral
  white: '#FFFFFF',
  gray50: '#F9FAFB',
  gray100: '#F2F4F6',
  gray200: '#E5E8EB',
  gray300: '#D1D6DB',
  gray400: '#B0B8C1',
  gray500: '#8B95A1',
  gray600: '#6B7684',
  gray700: '#4E5968',
  gray800: '#333D4B',
  gray900: '#191F28',

  // Semantic
  success: '#1AB759',
  warning: '#FFB020',
  danger: '#F04452',

  // Surfaces
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  title1: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  title2: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  small: { fontSize: 11, fontWeight: '400' as const, lineHeight: 14 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const tokens = { colors, spacing, radius, typography, shadows };
