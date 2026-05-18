import { create } from 'zustand';
import { monotonicFactory } from 'ulid';
const ulid = monotonicFactory(Math.random);
import type { Bill, Household, Silo, Transaction } from '../domain/entities';
import {
  transferCashToSilo,
  transferSiloToCash,
  updateSiloValue,
  setAllowanceOverride,
  clearAllowanceOverride,
  logAllowanceSpend,
} from '../domain/commands';
import {
  cashOnHand,
  freeToSpend,
  suggestedWeeklyAllowance,
  effectiveAllowance,
  weeklySpent,
  pendingBills,
  totalPending,
  netWorth,
  nextPaycheck,
  daysUntilPaycheck,
} from '../domain/selectors';

interface HouseholdState {
  household: Household | null;
  today: string;

  // Mutators
  setHousehold: (h: Household) => void;
  setToday: (today: string) => void;
  addBill: (draft: Omit<Bill, 'id' | 'paidAt' | 'paidAmount' | 'paidFromAccountId' | 'createdAt' | 'updatedAt'>) => void;
  addSilo: (draft: Omit<Silo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addTransaction: (draft: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateSiloValue: (siloId: string, newValue: number) => void;
  transferToSilo: (siloId: string, amount: number, fromAccountId: string) => void;
  transferFromSilo: (siloId: string, amount: number, toAccountId: string) => void;
  setAllowanceOverride: (amount: number) => void;
  clearAllowanceOverride: () => void;
  logAllowanceSpend: (label: string, amount: number) => void;

  // Derived selectors (computed from state)
  cashOnHand: () => number;
  freeToSpend: () => number;
  totalPending: () => number;
  suggestedWeeklyAllowance: () => number;
  effectiveAllowance: () => number;
  weeklySpent: () => number;
  netWorth: () => number;
  daysUntilPaycheck: () => number;
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  household: null,
  today: todayISO(),

  setHousehold: (h) => set({ household: h }),
  setToday: (today) => set({ today }),

  addBill: (draft) => {
    const { household, today } = get();
    if (!household) return;
    const now = today;
    const bill: Bill = {
      ...draft,
      id: ulid(),
      paidAt: null,
      paidAmount: null,
      paidFromAccountId: null,
      createdAt: now,
      updatedAt: now,
    };
    set({ household: { ...household, bills: [...household.bills, bill] } });
  },

  addSilo: (draft) => {
    const { household, today } = get();
    if (!household) return;
    const silo: Silo = { ...draft, id: ulid(), createdAt: today, updatedAt: today };
    set({ household: { ...household, silos: [...household.silos, silo] } });
  },

  addTransaction: (draft) => {
    const { household, today } = get();
    if (!household) return;
    const tx: Transaction = { ...draft, id: ulid(), createdAt: today };
    set({ household: { ...household, transactions: [...household.transactions, tx] } });
  },

  updateSiloValue: (siloId, newValue) => {
    const { household, today } = get();
    if (!household) return;
    const result = updateSiloValue(household, siloId, newValue, today, ulid());
    set({ household: result.household });
  },

  transferToSilo: (siloId, amount, fromAccountId) => {
    const { household, today } = get();
    if (!household) return;
    const result = transferCashToSilo(household, siloId, amount, fromAccountId, today, ulid());
    set({ household: result.household });
  },

  transferFromSilo: (siloId, amount, toAccountId) => {
    const { household, today } = get();
    if (!household) return;
    const result = transferSiloToCash(household, siloId, amount, toAccountId, today, ulid());
    set({ household: result.household });
  },

  setAllowanceOverride: (amount) => {
    const { household } = get();
    if (!household) return;
    set({ household: setAllowanceOverride(household, amount) });
  },

  clearAllowanceOverride: () => {
    const { household } = get();
    if (!household) return;
    set({ household: clearAllowanceOverride(household) });
  },

  logAllowanceSpend: (label, amount) => {
    const { household, today } = get();
    if (!household) return;
    const memberId = household.members[0]?.id ?? '';
    const result = logAllowanceSpend(household, label, amount, memberId, today, ulid());
    set({ household: result.household });
  },

  cashOnHand: () => {
    const { household } = get();
    return household ? cashOnHand(household) : 0;
  },

  freeToSpend: () => {
    const { household, today } = get();
    return household ? freeToSpend(household, today) : 0;
  },

  totalPending: () => {
    const { household, today } = get();
    return household ? totalPending(household) : 0;
  },

  suggestedWeeklyAllowance: () => {
    const { household, today } = get();
    return household ? suggestedWeeklyAllowance(household, today) : 0;
  },

  effectiveAllowance: () => {
    const { household, today } = get();
    return household ? effectiveAllowance(household, today) : 0;
  },

  weeklySpent: () => {
    const { household } = get();
    return household ? weeklySpent(household) : 0;
  },

  netWorth: () => {
    const { household, today } = get();
    return household ? netWorth(household, today) : 0;
  },

  daysUntilPaycheck: () => {
    const { household, today } = get();
    return household ? daysUntilPaycheck(household, today) : 30;
  },
}));
