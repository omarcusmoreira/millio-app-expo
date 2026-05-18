// Integration tests for features/onboarding/splash.feature (Stage 1)
// Run with: pnpm test src/features/onboarding/__tests__/splash.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
  Redirect: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

import ptBR from '../../../i18n/locales/pt-BR.json';
import enUS from '../../../i18n/locales/en-US.json';
type Locale = 'pt-BR' | 'en-US';
let currentLocale: Locale = 'pt-BR';
const tDicts: Record<Locale, Record<string, unknown>> = { 'pt-BR': ptBR, 'en-US': enUS };
const t = (key: string): string => {
  const dict = tDicts[currentLocale];
  const val = key.split('.').reduce((o: unknown, k) => (o as Record<string, unknown>)?.[k], dict);
  return typeof val === 'string' ? val : key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Subject ─────────────────────────────────────────────────────────────────

import SplashScreen from '../../../../app/(auth)/splash';
import { useAuthStore } from '../../../store/auth';

// ─── Setup ───────────────────────────────────────────────────────────────────

let mockPush: jest.Mock;

beforeEach(() => {
  currentLocale = 'pt-BR';
  mockPush = jest.requireMock('expo-router').router.push;
  mockPush.mockClear();
  useAuthStore.getState().reset();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: Splash screen', () => {
  describe('Scenario: Content', () => {
    it('shows milio. wordmark, both headline lines, and both CTAs', () => {
      render(<SplashScreen />);

      expect(screen.getByText('milio.')).toBeTruthy();
      expect(screen.getByText('Planejar sem ansiedade.')).toBeTruthy();
      expect(screen.getByText('Gastar sem culpa.')).toBeTruthy();
      expect(screen.getByText('Começar')).toBeTruthy();
      expect(screen.getByText('Já tenho conta')).toBeTruthy();
    });
  });

  describe('Scenario: en-US version', () => {
    it('shows English headlines when locale is en-US', () => {
      currentLocale = 'en-US';
      render(<SplashScreen />);

      expect(screen.getByText('Plan without anxiety.')).toBeTruthy();
      expect(screen.getByText('Spend without guilt.')).toBeTruthy();
    });
  });

  describe('Scenario: Tap "Começar" goes to auth method with intent "create"', () => {
    it('navigates to /(auth)/method and stores intent "create"', () => {
      render(<SplashScreen />);

      fireEvent.press(screen.getByText('Começar'));

      expect(mockPush).toHaveBeenCalledWith('/(auth)/method');
      expect(useAuthStore.getState().intent).toBe('create');
    });
  });

  describe('Scenario: Tap "Já tenho conta" goes with intent "signin"', () => {
    it('navigates to /(auth)/method and stores intent "signin"', () => {
      render(<SplashScreen />);

      fireEvent.press(screen.getByText('Já tenho conta'));

      expect(mockPush).toHaveBeenCalledWith('/(auth)/method');
      expect(useAuthStore.getState().intent).toBe('signin');
    });
  });
});
