// Integration tests for features/onboarding/done.feature (Stage 2)
// Run with: pnpm test src/features/onboarding/__tests__/done.test.tsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
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
const t = (key: string, params?: Record<string, unknown>): string => {
  const val = key.split('.').reduce((o: unknown, k) => (o as Record<string, unknown>)?.[k], ptBR as Record<string, unknown>);
  if (typeof val !== 'string') return key;
  if (!params) return val;
  return val.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''));
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// ─── Subject ─────────────────────────────────────────────────────────────────

import OnboardingDoneScreen from '../../../../app/(onboarding)/done';
import { useAuthStore } from '../../../store/auth';

// ─── Setup ───────────────────────────────────────────────────────────────────

let mockReplace: jest.Mock;

beforeEach(() => {
  mockReplace = jest.requireMock('expo-router').router.replace;
  mockReplace.mockClear();
  useAuthStore.getState().reset();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: Final screen (payoff)', () => {
  describe('Scenario: Solo path shows user name in headline', () => {
    it('shows "Pronto, Marcus." headline and standard subtitle', () => {
      useAuthStore.setState({ name: 'Marcus', householdChoice: 'solo' });
      render(<OnboardingDoneScreen />);

      expect(screen.getByText('Pronto, Marcus.')).toBeTruthy();
      expect(screen.getByText(t('onboarding.done.subStandard'))).toBeTruthy();
    });
  });

  describe('Scenario: Joined path has different subtitle', () => {
    it('shows join-specific subtitle when householdChoice is "join"', () => {
      useAuthStore.setState({ name: 'Marcus', householdChoice: 'join' });
      render(<OnboardingDoneScreen />);

      expect(screen.getByText(t('onboarding.done.subJoined'))).toBeTruthy();
    });
  });

  describe('Scenario: Preview card', () => {
    it('shows preview label "INÍCIO · LIVRE PRA GASTAR" and Essa semana', () => {
      render(<OnboardingDoneScreen />);

      expect(screen.getByText(t('onboarding.done.previewLabel'))).toBeTruthy();
      expect(screen.getByText(t('onboarding.done.previewWeek'))).toBeTruthy();
    });
  });

  describe('Scenario: "Abrir Milio" finishes onboarding', () => {
    it('navigates to /(tabs)/home immediately on tap', () => {
      useAuthStore.setState({ name: 'Marcus', householdChoice: 'solo' });
      render(<OnboardingDoneScreen />);

      fireEvent.press(screen.getByText(t('onboarding.done.primary')));

      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
    });
  });

  describe('Scenario: Footnote', () => {
    it('shows footnote and subline', () => {
      render(<OnboardingDoneScreen />);

      expect(screen.getByText(t('onboarding.done.footnote'))).toBeTruthy();
      expect(screen.getByText(t('onboarding.done.subline'))).toBeTruthy();
    });
  });
});
