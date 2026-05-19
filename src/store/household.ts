import { create } from 'zustand';
import { monotonicFactory } from 'ulid';
const ulid = monotonicFactory(Math.random);
import type { Bill, CashAccount, Category, ColorToken, Household, Income, Label, Member, Silo, Transaction } from '../domain/entities';
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
  updateTransaction: (id: string, draft: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (name: string, color: string) => void;
  removeCategory: (id: string) => void;
  addLabel: (name: string) => void;
  removeLabel: (id: string) => void;
  addCashAccount: (draft: Omit<CashAccount, 'id'>) => void;
  removeCashAccount: (id: string) => void;
  updateBill: (id: string, draft: Partial<Omit<Bill, 'id' | 'createdAt'>>) => void;
  deleteBill: (id: string) => void;
  addIncome: (draft: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, draft: Partial<Omit<Income, 'id' | 'createdAt'>>) => void;
  deleteIncome: (id: string) => void;
  updateSilo: (id: string, draft: Partial<Omit<Silo, 'id' | 'createdAt'>>) => void;
  deleteSilo: (id: string) => void;
  updateCategory: (id: string, name: string, color: string) => void;
  updateLabel: (id: string, name: string) => void;
  updateCashAccount: (id: string, name: string) => void;
  updateHouseholdName: (name: string) => void;
  addMember: (name: string, color: ColorToken) => void;
  updateMember: (id: string, draft: { name: string; color: ColorToken }) => void;
  removeMember: (id: string) => void;
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

  updateTransaction: (id, draft) => {
    const { household } = get();
    if (!household) return;
    set({
      household: {
        ...household,
        transactions: household.transactions.map((t) =>
          t.id === id ? { ...t, ...draft } : t
        ),
      },
    });
  },

  deleteTransaction: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, transactions: household.transactions.filter((t) => t.id !== id) } });
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

  addCategory: (name, color) => {
    const { household } = get();
    if (!household) return;
    const cat: Category = { id: ulid(), name, color };
    set({ household: { ...household, categories: [...household.categories, cat] } });
  },

  removeCategory: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, categories: household.categories.filter((c) => c.id !== id) } });
  },

  addLabel: (name) => {
    const { household } = get();
    if (!household) return;
    const label: Label = { id: ulid(), name };
    set({ household: { ...household, labels: [...household.labels, label] } });
  },

  removeLabel: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, labels: household.labels.filter((l) => l.id !== id) } });
  },

  addCashAccount: (draft) => {
    const { household } = get();
    if (!household) return;
    const account: CashAccount = { id: ulid(), ...draft };
    set({ household: { ...household, cashAccounts: [...household.cashAccounts, account] } });
  },

  removeCashAccount: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, cashAccounts: household.cashAccounts.filter((a) => a.id !== id) } });
  },

  updateBill: (id, draft) => {
    const { household, today } = get();
    if (!household) return;
    set({ household: { ...household, bills: household.bills.map((b) => b.id === id ? { ...b, ...draft, updatedAt: today } : b) } });
  },

  deleteBill: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, bills: household.bills.filter((b) => b.id !== id) } });
  },

  addIncome: (draft) => {
    const { household, today } = get();
    if (!household) return;
    const income: Income = { id: ulid(), ...draft, createdAt: today };
    set({ household: { ...household, incomes: [...household.incomes, income] } });
  },

  updateIncome: (id, draft) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, incomes: household.incomes.map((i) => i.id === id ? { ...i, ...draft } : i) } });
  },

  deleteIncome: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, incomes: household.incomes.filter((i) => i.id !== id) } });
  },

  updateSilo: (id, draft) => {
    const { household, today } = get();
    if (!household) return;
    set({ household: { ...household, silos: household.silos.map((s) => s.id === id ? { ...s, ...draft, updatedAt: today } : s) } });
  },

  deleteSilo: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, silos: household.silos.filter((s) => s.id !== id) } });
  },

  updateCategory: (id, name, color) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, categories: household.categories.map((c) => c.id === id ? { ...c, name, color } : c) } });
  },

  updateLabel: (id, name) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, labels: household.labels.map((l) => l.id === id ? { ...l, name } : l) } });
  },

  updateCashAccount: (id, name) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, cashAccounts: household.cashAccounts.map((a) => a.id === id ? { ...a, name } : a) } });
  },

  updateHouseholdName: (name) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, name } });
  },

  addMember: (name, color) => {
    const { household, today } = get();
    if (!household) return;
    const member: Member = { id: ulid(), name, initial: name[0]?.toUpperCase() ?? '?', color, joinedAt: today };
    set({ household: { ...household, members: [...household.members, member] } });
  },

  updateMember: (id, draft) => {
    const { household } = get();
    if (!household) return;
    set({
      household: {
        ...household,
        members: household.members.map((m) =>
          m.id === id ? { ...m, ...draft, initial: draft.name[0]?.toUpperCase() ?? m.initial } : m
        ),
      },
    });
  },

  removeMember: (id) => {
    const { household } = get();
    if (!household) return;
    set({ household: { ...household, members: household.members.filter((m) => m.id !== id) } });
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
