import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './tokens';
import type { Colors } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: 'milio-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ preference: s.preference }),
    }
  )
);

const ThemeContext = createContext<Colors>(lightColors);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  const resolved = preference === 'system' ? (scheme ?? 'light') : preference;
  const colors = resolved === 'dark' ? darkColors : lightColors;
  return <ThemeContext.Provider value={colors}>{children}</ThemeContext.Provider>;
}

export function useColors(): Colors {
  return useContext(ThemeContext);
}
