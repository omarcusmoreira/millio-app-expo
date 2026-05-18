// Integration tests for features/onboarding/identity.feature (Stage 1)
// Run with: pnpm test src/features/onboarding/__tests__/identity.test.tsx

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

import OnboardingIdentityScreen from '../../../../app/(onboarding)/identity';
import { useHouseholdStore } from '../../../store/household';

// ─── Setup ───────────────────────────────────────────────────────────────────

let mockPush: jest.Mock;

beforeEach(() => {
  mockPush = jest.requireMock('expo-router').router.push;
  mockPush.mockClear();
  useHouseholdStore.setState({ household: null });
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: Identity — first name only', () => {
  describe('Scenario: Valid name enables the button', () => {
    it('shows avatar initial and enables the button when name is typed', () => {
      render(<OnboardingIdentityScreen />);

      const input = screen.getByPlaceholderText('Marcos');
      fireEvent.changeText(input, 'Marcus');

      expect(screen.getByText('M')).toBeTruthy();
      const btn = screen.getByText('Continuar');
      expect(btn).toBeTruthy();
    });
  });

  describe('Scenario: Initial is derived automatically', () => {
    it('shows the first letter as the avatar initial', () => {
      render(<OnboardingIdentityScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Marcos'), 'Patricia');

      expect(screen.getByText('P')).toBeTruthy();
    });
  });

  describe('Scenario: Empty keeps the button disabled', () => {
    it('Continuar button is disabled when field is empty', () => {
      render(<OnboardingIdentityScreen />);

      const btn = screen.getByRole('button', { name: 'Continuar' });
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Scenario: Continue goes to setup-bills', () => {
    it('navigates to /onboarding/setup-bills after typing a name and tapping Continuar', () => {
      render(<OnboardingIdentityScreen />);

      fireEvent.changeText(screen.getByPlaceholderText('Marcos'), 'Marcus');
      fireEvent.press(screen.getByText('Continuar'));

      expect(mockPush).toHaveBeenCalledWith('/(onboarding)/setup-bills');
    });
  });
});
