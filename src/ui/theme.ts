import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import type { Colors } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

// ─── Light palette ────────────────────────────────────────────────────────────

const lightColors: Colors = {
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
};

// ─── Dark palette ─────────────────────────────────────────────────────────────

const darkColors: Colors = {
  background: {
    page: '#121110',
    surface: '#1E1D1B',
    surfaceSoft: '#252421',
    keyboardChip: '#2C2B28',
  },
  border: {
    default: '#2E2D2A',
    emphasis: '#3A3936',
    divider: '#272624',
  },
  ink: {
    1: '#F2F0EC',
    2: '#C4C2BC',
    3: '#8E8D88',
    4: '#5A5956',
  },
  brand: {
    terracotta: '#D4795A',
    terracottaPressed: '#E08B6C',
    terracottaSoft: '#3A1F15',
  },
  semantic: {
    olive: '#8FA066',
    warmGrey: '#B0A493',
  },
  avatar: {
    terracotta: { bg: '#D4795A', fg: '#FBF8F3' },
    olive: { bg: '#8FA066', fg: '#FBF8F3' },
    grey: { bg: '#B0A493', fg: '#FBF8F3' },
  },
};

// ─── Theme store ──────────────────────────────────────────────────────────────

interface ThemeState {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  preference: 'system',
  setPreference: (preference) => set({ preference }),
}));

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useColors(): Colors {
  const preference = useThemeStore((s) => s.preference);
  const systemScheme = useColorScheme();

  const isDark =
    preference === 'dark' ||
    (preference === 'system' && systemScheme === 'dark');

  return isDark ? darkColors : lightColors;
}
