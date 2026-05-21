// Integration tests for features/onboarding/household.feature (Stage 2)
// Run with: pnpm test src/features/onboarding/__tests__/household.test.tsx

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

import SetupHouseholdScreen from '../../../../app/(onboarding)/setup-household';
import SetupHouseholdNameScreen from '../../../../app/(onboarding)/setup-household-name';
import { useAuthStore } from '../../../store/auth';
import { useHouseholdStore } from '../../../store/household';

// ─── Setup ───────────────────────────────────────────────────────────────────

let mockPush: jest.Mock;

beforeEach(() => {
  mockPush = jest.requireMock('expo-router').router.push;
  mockPush.mockClear();
  useAuthStore.getState().reset();
  useHouseholdStore.setState({ household: null });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: Household choice', () => {
  describe('Scenario: Three options available', () => {
    it('shows all three choice cards with correct titles and subtitles', () => {
      render(<SetupHouseholdScreen />);

      expect(screen.getByText(t('onboarding.lar.createTitle'))).toBeTruthy();
      expect(screen.getByText(t('onboarding.lar.createSub'))).toBeTruthy();
      expect(screen.getByText(t('onboarding.lar.joinTitle'))).toBeTruthy();
      expect(screen.getByText(t('onboarding.lar.joinSub'))).toBeTruthy();
      expect(screen.getByText(t('onboarding.lar.soloTitle'))).toBeTruthy();
      expect(screen.getByText(t('onboarding.lar.soloSub'))).toBeTruthy();
    });
  });

  describe('Scenario: "Por enquanto, só eu" jumps straight to done', () => {
    it('navigates to /onboarding/done, stores householdChoice "solo", and creates a household', () => {
      useAuthStore.setState({ name: 'Marcus' });
      render(<SetupHouseholdScreen />);

      fireEvent.press(screen.getByText(t('onboarding.lar.soloTitle')));

      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/done');
      expect(useAuthStore.getState().householdChoice).toBe('solo');
      const household = useHouseholdStore.getState().household;
      expect(household).not.toBeNull();
      expect(household?.members).toHaveLength(1);
      expect(household?.members[0]?.name).toBe('Marcus');
    });
  });

  describe('Scenario: "Criar um lar" goes to naming', () => {
    it('navigates to setup-household-name and stores householdChoice "create"', () => {
      render(<SetupHouseholdScreen />);

      fireEvent.press(screen.getByText(t('onboarding.lar.createTitle')));

      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/setup-household-name');
      expect(useAuthStore.getState().householdChoice).toBe('create');
    });
  });

  describe('Scenario: "Entrar num lar" goes to join', () => {
    it('navigates to setup-household-join and stores householdChoice "join"', () => {
      render(<SetupHouseholdScreen />);

      fireEvent.press(screen.getByText(t('onboarding.lar.joinTitle')));

      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/setup-household-join');
      expect(useAuthStore.getState().householdChoice).toBe('join');
    });
  });

  describe('Scenario: Default name uses the user\'s first name', () => {
    it('shows placeholder "Lar dos Marcus" and a skip link', () => {
      useAuthStore.setState({ name: 'Marcus' });
      render(<SetupHouseholdNameScreen />);

      const expectedPlaceholder = t('onboarding.larName.placeholder', { lastname: 'Marcus' });
      const input = screen.getByPlaceholderText(expectedPlaceholder);
      expect(input).toBeTruthy();
      expect(screen.getByText(t('onboarding.larName.skip'))).toBeTruthy();
    });
  });
});
