import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthMethod = 'apple' | 'google' | 'email';
export type Intent = 'create' | 'signin';
export type HouseholdChoice = 'solo' | 'create' | 'join';

interface AuthState {
  intent: Intent;
  name: string;
  email: string;
  birthdate: string;
  currentMemberId: string;
  avatarColor: string;
  authMethod: AuthMethod | null;
  householdChoice: HouseholdChoice | null;
  setIntent: (intent: Intent) => void;
  setAuthMethod: (method: AuthMethod) => void;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setBirthdate: (birthdate: string) => void;
  setCurrentMemberId: (id: string) => void;
  setAvatarColor: (hex: string) => void;
  setHouseholdChoice: (choice: HouseholdChoice) => void;
  reset: () => void;
}

const initial = {
  intent: 'create' as Intent,
  name: '',
  email: '',
  birthdate: '',
  currentMemberId: '',
  avatarColor: '#C26B4D',
  authMethod: null as AuthMethod | null,
  householdChoice: null as HouseholdChoice | null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initial,
      setIntent: (intent) => set({ intent }),
      setAuthMethod: (authMethod) => set({ authMethod }),
      setName: (name) => set({ name }),
      setEmail: (email) => set({ email }),
      setBirthdate: (birthdate) => set({ birthdate }),
      setCurrentMemberId: (currentMemberId) => set({ currentMemberId }),
      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setHouseholdChoice: (householdChoice) => set({ householdChoice }),
      reset: () => set(initial),
    }),
    {
      name: 'milio-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        intent: s.intent,
        name: s.name,
        email: s.email,
        birthdate: s.birthdate,
        currentMemberId: s.currentMemberId,
        avatarColor: s.avatarColor,
        authMethod: s.authMethod,
        householdChoice: s.householdChoice,
      }),
    }
  )
);
