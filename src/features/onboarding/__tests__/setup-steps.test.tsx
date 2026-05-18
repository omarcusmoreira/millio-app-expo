// Integration tests for features/onboarding/setup-steps.feature (Stage 2)
// Run with: pnpm test src/features/onboarding/__tests__/setup-steps.test.tsx

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

// ─── Subjects ────────────────────────────────────────────────────────────────

import SetupBillsScreen from '../../../../app/(onboarding)/setup-bills';
import SetupIncomesScreen from '../../../../app/(onboarding)/setup-incomes';
import SetupSilosScreen from '../../../../app/(onboarding)/setup-silos';
import { useAuthStore } from '../../../store/auth';

// ─── Setup ───────────────────────────────────────────────────────────────────

let mockPush: jest.Mock;
let mockBack: jest.Mock;

beforeEach(() => {
  mockPush = jest.requireMock('expo-router').router.push;
  mockBack = jest.requireMock('expo-router').router.back;
  mockPush.mockClear();
  mockBack.mockClear();
  useAuthStore.getState().reset();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: Explanatory setup steps', () => {
  describe('Scenario: setup-bills has correct content', () => {
    it('shows step indicator "1/4 · Suas contas", preview card, footer, and Continuar button', () => {
      render(<SetupBillsScreen />);

      expect(screen.getByText('1/4 · Suas contas')).toBeTruthy();
      expect(screen.getByText('CONTAS · MAIO')).toBeTruthy();
      expect(screen.getByText(t('onboarding.bills.footer'))).toBeTruthy();
      expect(screen.getByText(t('common.continue'))).toBeTruthy();
    });

    it('Continuar navigates to setup-incomes', () => {
      render(<SetupBillsScreen />);
      fireEvent.press(screen.getByText(t('common.continue')));
      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/setup-incomes');
    });
  });

  describe('Scenario: setup-incomes has correct content', () => {
    it('shows step indicator "2/4 · Sua renda", preview card with user name, footer, and Continuar button', () => {
      useAuthStore.setState({ name: 'Marcus' });
      render(<SetupIncomesScreen />);

      expect(screen.getByText('2/4 · Sua renda')).toBeTruthy();
      expect(screen.getByText('PERFIL · MARCUS')).toBeTruthy();
      expect(screen.getByText(t('onboarding.incomes.footer'))).toBeTruthy();
      expect(screen.getByText(t('common.continue'))).toBeTruthy();
    });

    it('shows fallback name "Marcos" when no name is set', () => {
      render(<SetupIncomesScreen />);
      expect(screen.getByText('PERFIL · MARCOS')).toBeTruthy();
    });

    it('Continuar navigates to setup-silos', () => {
      render(<SetupIncomesScreen />);
      fireEvent.press(screen.getByText(t('common.continue')));
      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/setup-silos');
    });
  });

  describe('Scenario: setup-silos has correct content', () => {
    it('shows step indicator "3/4 · Seus silos", preview card, footer, and Continuar button', () => {
      render(<SetupSilosScreen />);

      expect(screen.getByText('3/4 · Seus silos')).toBeTruthy();
      expect(screen.getByText('SILOS')).toBeTruthy();
      expect(screen.getByText(t('onboarding.silos.footer'))).toBeTruthy();
      expect(screen.getByText(t('common.continue'))).toBeTruthy();
    });

    it('Continuar navigates to setup-household', () => {
      render(<SetupSilosScreen />);
      fireEvent.press(screen.getByText(t('common.continue')));
      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/setup-household');
    });
  });

  describe('Scenario: Back navigation', () => {
    it('tapping back on setup-silos calls router.back', () => {
      render(<SetupSilosScreen />);
      fireEvent.press(screen.getByText('‹'));
      expect(mockBack).toHaveBeenCalled();
    });

    it('tapping back on setup-bills calls router.back', () => {
      render(<SetupBillsScreen />);
      fireEvent.press(screen.getByText('‹'));
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
