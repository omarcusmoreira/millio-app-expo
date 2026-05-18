import { create } from 'zustand';

export type AuthMethod = 'apple' | 'google' | 'email';
export type Intent = 'create' | 'signin';
export type HouseholdChoice = 'solo' | 'create' | 'join';

interface AuthState {
  intent: Intent;
  name: string;
  email: string;
  authMethod: AuthMethod | null;
  householdChoice: HouseholdChoice | null;
  setIntent: (intent: Intent) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setHouseholdChoice: (choice: HouseholdChoice) => void;
  reset: () => void;
}

const initial = {
  intent: 'create' as Intent,
  name: '',
  email: '',
  authMethod: null as AuthMethod | null,
  householdChoice: null as HouseholdChoice | null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initial,
  setIntent: (intent) => set({ intent }),
  setAuthMethod: (authMethod) => set({ authMethod }),
  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setHouseholdChoice: (householdChoice) => set({ householdChoice }),
  reset: () => set(initial),
}));
