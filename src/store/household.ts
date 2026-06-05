import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { monotonicFactory } from 'ulid';
const ulid = monotonicFactory(Math.random);
import type { CashAccount, Category, ColorToken, Expense, Household, Income, Label, Member, Silo, Transaction } from '../domain/entities';
import {
  transferCashToSilo,
  transferSiloToCash,
  updateSiloValue,
  markExpensePaid as _markExpensePaid,
  removeMember as _removeMember,
} from '../domain/commands';
import {
  cashOnHand,
  freeToSpend,
  suggestedWeeklyAllowance,
  weeklySpent,
  pendingExpenses,
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
  addExpense: (draft: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, draft: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  deleteExpense: (id: string) => void;
  markExpensePaid: (expenseId: string) => void;
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
  markIncomeReceived: (txId: string) => void;

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

export const useHouseholdStore = create<HouseholdState>()(
  persist(
  (set, get) => ({
  household: null,
  today: todayISO(),

  setHousehold: (h) => set({ household: h }),
  setToday: (today) => set({ today }),

  addExpense: (draft) => {
    const { household, today } = get();
    if (!household) return;
    const now = today;
    const expenseId = ulid();
    const expense: Expense = {
      ...draft,
      id: expenseId,
      createdAt: now,
      updatedAt: now,
    };
    let transactions = [...household.transactions];
    if (draft.recurring === 'one-time') {
      const tx: Transaction = {
        id: ulid(),
        kind: 'expense',
        name: draft.name,
        amount: draft.amount ?? draft.estimate ?? 0,
        date: draft.date,
        byMemberId: draft.assigneeId,
        accountId: draft.accountId,
        siloId: null,
        expenseId,
        categoryIds: [...draft.categoryIds],
        receivedAt: null,
        createdAt: now,
      };
      transactions = [...transactions, tx];
    }
    set({ household: { ...household, expenses: [...household.expenses, expense], transactions } });
  },

  updateExpense: (id, draft) => {
    const { household, today } = get();
    if (!household) return;
    const existing = household.expenses.find((e) => e.id === id);
    if (!existing) return;
    const updated = { ...existing, ...draft, updatedAt: today };
    let transactions = household.transactions;
    if (existing.recurring === 'one-time') {
      transactions = transactions.map((t) =>
        t.expenseId === id
          ? { ...t, amount: updated.amount ?? updated.estimate ?? 0, date: updated.date, accountId: updated.accountId }
          : t
      );
    }
    set({ household: { ...household, expenses: household.expenses.map((e) => e.id === id ? updated : e), transactions } });
  },

  deleteExpense: (id) => {
    const { household } = get();
    if (!household) return;
    set({
      household: {
        ...household,
        expenses: household.expenses.filter((e) => e.id !== id),
        transactions: household.transactions.filter((t) => t.expenseId !== id),
      },
    });
  },

  markExpensePaid: (expenseId) => {
    const { household, today } = get();
    if (!household) return;
    const result = _markExpensePaid(household, expenseId, today, ulid());
    set({ household: result.household });
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

  markIncomeReceived: (txId) => {
    const { household, today } = get();
    if (!household) return;
    const tx = household.transactions.find((t) => t.id === txId);
    if (!tx || tx.kind !== 'income') return;
    const receivedAt = tx.receivedAt === null ? today : null;
    set({
      household: {
        ...household,
        transactions: household.transactions.map((t) =>
          t.id === txId ? { ...t, receivedAt } : t
        ),
      },
    });
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
    set({ household: _removeMember(household, id) });
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
    const { household } = get();
    return household ? totalPending(household) : 0;
  },

  suggestedWeeklyAllowance: () => {
    const { household, today } = get();
    return household ? suggestedWeeklyAllowance(household, today) : 0;
  },

  effectiveAllowance: () => {
    const { household, today } = get();
    return household ? suggestedWeeklyAllowance(household, today) : 0;
  },

  weeklySpent: () => {
    const { household, today } = get();
    return household ? weeklySpent(household, today) : 0;
  },

  netWorth: () => {
    const { household, today } = get();
    return household ? netWorth(household, today) : 0;
  },

  daysUntilPaycheck: () => {
    const { household, today } = get();
    return household ? daysUntilPaycheck(household, today) : 30;
  },
  }),
  {
    name: 'milio-household',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (s) => ({ household: s.household, today: s.today }),
    onRehydrateStorage: () => (state) => {
      if (state) state.today = todayISO();
    },
    version: 3,
    migrate: (persisted: unknown, version: number) => {
      const state = persisted as Record<string, unknown>;
      if (version < 2 && state.household) {
        const h = state.household as Record<string, unknown>;
        // bills → expenses: rename field, map due→date, paidFromAccountId→accountId
        if (Array.isArray(h.bills) && !Array.isArray(h.expenses)) {
          h.expenses = (h.bills as Record<string, unknown>[]).map((b) => ({
            ...b,
            date: b.due ?? b.date,
            accountId: b.paidFromAccountId ?? b.accountId ?? null,
            recurring: b.recurring ?? 'monthly',
            endsAt: b.endsAt ?? null,
            due: undefined,
            paidFromAccountId: undefined,
          }));
          delete h.bills;
        }
        if (!Array.isArray(h.expenses)) h.expenses = [];
        // Remove allowance field
        delete h.allowance;
        // Fix transactions: bill-payment → expense, billId → expenseId
        if (Array.isArray(h.transactions)) {
          h.transactions = (h.transactions as Record<string, unknown>[]).map((t) => ({
            ...t,
            kind: t.kind === 'bill-payment' || t.kind === 'allowance-spend' ? 'expense' : t.kind,
            expenseId: t.expenseId ?? t.billId ?? null,
            billId: undefined,
          }));
        }
        state.household = h;
      }
      if (version < 3 && state.household) {
        const h = state.household as Record<string, unknown>;
        // Add receivedAt: existing income tx = already received (set to date); others = null
        if (Array.isArray(h.transactions)) {
          h.transactions = (h.transactions as Record<string, unknown>[]).map((t) => ({
            ...t,
            receivedAt: !('receivedAt' in t)
              ? (t.kind === 'income' ? (t.date ?? null) : null)
              : t.receivedAt,
          }));
        }
        state.household = h;
      }
      return state;
    },
  }
));
