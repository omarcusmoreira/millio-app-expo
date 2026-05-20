export const lightColors = {
  background: {
    page: '#FBFBFA',
    surface: '#FFFFFF',
    surfaceSoft: '#F6F6F4',
    keyboardChip: '#F2F2F0',
  },
  border: {
    default: '#EAEAE8',
    emphasis: '#DEDEDB',
    divider: '#EFEFED',
  },
  ink: {
    1: '#1A1815',
    2: '#4A4844',
    3: '#71706C',
    4: '#A4A39E',
  },
  brand: {
    terracotta: '#C26B4D',
    terracottaPressed: '#A85638',
    terracottaSoft: '#F5E5DE',
  },
  semantic: {
    olive: '#6F7A4F',
    warmGrey: '#998C7A',
  },
  avatar: {
    terracotta: { bg: '#C26B4D', fg: '#FBF8F3' },
    olive: { bg: '#6F7A4F', fg: '#FBF8F3' },
    grey: { bg: '#998C7A', fg: '#FBF8F3' },
  },
} as const;

export const darkColors = {
  background: {
    page: '#0F0E0D',
    surface: '#1C1A18',
    surfaceSoft: '#242220',
    keyboardChip: '#2A2826',
  },
  border: {
    default: '#2E2C2A',
    emphasis: '#3A3836',
    divider: '#232120',
  },
  ink: {
    1: '#F0EDE8',
    2: '#C4C0BB',
    3: '#8A8680',
    4: '#5C5A56',
  },
  brand: {
    terracotta: '#C26B4D',
    terracottaPressed: '#A85638',
    terracottaSoft: '#3A2520',
  },
  semantic: {
    olive: '#6F7A4F',
    warmGrey: '#998C7A',
  },
  avatar: {
    terracotta: { bg: '#C26B4D', fg: '#FBF8F3' },
    olive: { bg: '#6F7A4F', fg: '#FBF8F3' },
    grey: { bg: '#998C7A', fg: '#FBF8F3' },
  },
} as const;

// Backward-compat alias — components should use useColors() from src/ui/theme instead
export const colors = lightColors;

export const font = {
  family: {
    serif: 'Fraunces',
    sans: 'Inter',
    mono: 'JetBrainsMono',
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
  },
  size: {
    hero: 60,
    heroSmall: 44,
    h1: 22,
    hSection: 16,
    body: 14,
    small: 12.5,
    label: 12,
    eyebrow: 11,
    mono: 10.5,
  },
  letterSpacing: {
    eyebrow: 0.88,  // 0.08em × 11
    hero: -1.2,     // -0.02em × 60
    h1: -0.22,      // -0.01em × 22
    body: -0.07,    // -0.005em × 14
  },
  lineHeight: {
    tight: 1.0,
    snug: 1.15,
    normal: 1.45,
    relaxed: 1.6,
  },
} as const;

export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 8,
  4: 10,
  5: 12,
  6: 14,
  7: 18,
  8: 22,
  9: 28,
  10: 36,
} as const;

export const radius = {
  sharp: 0,
  small: 4,
  medium: 8,
  large: 10,
  xl: 14,
  pill: 999,
} as const;

export const animation = {
  duration: {
    instant: 120,
    quick: 160,
    smooth: 220,
    slow: 280,
  },
  easing: {
    standard: [0.2, 0.6, 0.2, 1] as [number, number, number, number],
    decel: [0, 0, 0.2, 1] as [number, number, number, number],
  },
} as const;

export const avatarSize = {
  sm: 22,
  md: 32,
  lg: 44,
} as const;

export const iconSize = {
  tiny: 14,
  small: 16,
  default: 20,
  large: 22,
} as const;

export const statusBox = {
  size: 10,
  radius: 2,
} as const;

export const strokeWidth = {
  default: 1.6,
  active: 1.8,
} as const;

export type ColorToken = 'terracotta' | 'olive' | 'grey';

export type Colors = {
  background: { page: string; surface: string; surfaceSoft: string; keyboardChip: string };
  border: { default: string; emphasis: string; divider: string };
  ink: { 1: string; 2: string; 3: string; 4: string };
  brand: { terracotta: string; terracottaPressed: string; terracottaSoft: string };
  semantic: { olive: string; warmGrey: string };
  avatar: {
    terracotta: { bg: string; fg: string };
    olive: { bg: string; fg: string };
    grey: { bg: string; fg: string };
  };
};
