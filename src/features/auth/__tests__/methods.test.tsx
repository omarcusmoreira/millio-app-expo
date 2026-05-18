// Integration tests for features/auth/methods.feature (Stage 1)
// Run with: pnpm test src/features/auth/__tests__/methods.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
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
const t = (key: string): string => {
  const val = key.split('.').reduce((o: unknown, k) => (o as Record<string, unknown>)?.[k], ptBR as Record<string, unknown>);
  return typeof val === 'string' ? val : key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Subject ─────────────────────────────────────────────────────────────────

import AuthMethodScreen from '../../../../app/(auth)/method';
import { useAuthStore } from '../../../store/auth';

// ─── Setup ───────────────────────────────────────────────────────────────────

let mockPush: jest.Mock;

beforeEach(() => {
  mockPush = jest.requireMock('expo-router').router.push;
  mockPush.mockClear();
  useAuthStore.getState().reset();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: Authentication methods', () => {
  describe('Scenario: Method screen has every option', () => {
    it('shows all auth buttons and OU separator', () => {
      render(<AuthMethodScreen />);

      expect(screen.getByText('Continuar com Apple')).toBeTruthy();
      expect(screen.getByText('Continuar com Google')).toBeTruthy();
      expect(screen.getByText('OU')).toBeTruthy();
      expect(screen.getByText('Continuar com e-mail')).toBeTruthy();
    });

    it('shows signup headline for intent "create"', () => {
      render(<AuthMethodScreen />);

      expect(screen.getByText('Vamos começar.')).toBeTruthy();
    });
  });

  describe('Scenario: Apple and Google jump to identity (mocked)', () => {
    it('tapping Apple navigates to identity and stores authMethod "apple"', () => {
      render(<AuthMethodScreen />);

      fireEvent.press(screen.getByText('Continuar com Apple'));

      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/identity');
      expect(useAuthStore.getState().authMethod).toBe('apple');
    });

    it('tapping Google navigates to identity and stores authMethod "google"', () => {
      render(<AuthMethodScreen />);

      fireEvent.press(screen.getByText('Continuar com Google'));

      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/identity');
      expect(useAuthStore.getState().authMethod).toBe('google');
    });
  });

  describe('Scenario: Email opens an input', () => {
    it('tapping email navigates to /auth/email', () => {
      render(<AuthMethodScreen />);

      fireEvent.press(screen.getByText('Continuar com e-mail'));

      expect(mockPush).toHaveBeenCalledWith('/(auth)/email');
    });
  });

  describe('Scenario: Signin path has different copy', () => {
    it('shows signin headline when intent is "signin"', () => {
      useAuthStore.setState({ intent: 'signin' });

      render(<AuthMethodScreen />);

      expect(screen.getByText('Que bom te ver.')).toBeTruthy();
      expect(screen.getByText('Escolha como entrar.')).toBeTruthy();
    });
  });
});
