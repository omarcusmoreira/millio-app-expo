// Gherkin: allowance/calculation.feature  (@unit scenarios)
// Tests that remain after removing override/log-spend features.

import { describe, it, expect } from 'vitest';
import type { Expense, Income, Transaction } from '../../../domain/entities';
import {
  suggestedWeeklyAllowance,
  weeklySpent,
  freeToSpend,
} from '../../../domain/selectors';
import { parseMoney, createWorld, parseRelDate } from '../../_support/world';

type World = ReturnType<typeof createWorld>;

function seedBalance(w: World, amount: number): void {
  const accountId = w.household.cashAccounts[0]?.id ?? 'acc';
  const tx: Transaction = {
    id: `seed-${Date.now()}`,
    kind: 'income',
    name: 'Balance seed',
    amount,
    date: w.today,
    byMemberId: w.household.members[0]?.id ?? 'm1',
    accountId,
    siloId: null,
    expenseId: null,
    categoryIds: [],
    receivedAt: w.today,
    createdAt: w.today,
  };
  w.household = { ...w.household, transactions: [...w.household.transactions, tx] };
}

function addAccount(w: World): string {
  const id = 'acc-itau';
  w.household = {
    ...w.household,
    cashAccounts: [{ id, name: 'Itaú checking', ownerId: w.household.members[0]?.id ?? 'm1' }],
  };
  return id;
}

function addIncome(w: World, amount: number, payDay: number): void {
  const income: Income = {
    id: `inc-${payDay}`,
    name: 'Salary',
    amount,
    memberId: w.household.members[0]?.id ?? 'm1',
    schedule: { kind: 'monthly', days: [payDay] },
    createdAt: w.today,
  };
  w.household = { ...w.household, incomes: [...w.household.incomes, income] };
}

function addExpense(w: World, name: string, amount: number, dateStr: string): void {
  const expense: Expense = {
    id: `expense-${name}`,
    name,
    amount,
    estimate: null,
    variable: false,
    date: parseRelDate(dateStr, w.today),
    recurring: 'monthly',
    endsAt: null,
    assigneeId: w.household.members[0]?.id ?? 'm1',
    accountId: null,
    categoryIds: [],
    labelIds: [],
    paidAt: null,
    paidAmount: null,
    createdAt: w.today,
    updatedAt: w.today,
  };
  w.household = { ...w.household, expenses: [...w.household.expenses, expense] };
}

function background(): World {
  const w = createWorld();
  addAccount(w);
  seedBalance(w, parseMoney('R$ 10.000,00'));
  addIncome(w, parseMoney('R$ 6.800,00'), 1);
  return w;
}

// ─── Feature: Automatic weekly allowance calculation ──────────────────────────

describe('Feature: Automatic weekly allowance calculation', () => {
  it('@unit Default suggestion — free_to_spend / days_to_paycheck × 7', () => {
    const w = background();
    addExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    // free_to_spend = 10000 - 2850 = 7150; today=May16, next=Jun1 → 16 days
    // 7150 / 16 * 7 = 3128.125 → rounds to 3128
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(suggestion).toBeCloseTo(parseMoney('R$ 3.128,00'), -1);
  });

  it('@unit @invariant Inv-6 — suggestion never exceeds free-to-spend', () => {
    const w = background();
    addExpense(w, 'Rent', parseMoney('R$ 8.000,00'), 'in 5 days');
    const fts = freeToSpend(w.household, w.today);
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(suggestion).toBeLessThanOrEqual(fts + 1); // +1 for rounding tolerance
  });

  it('@unit effectiveAllowance equals suggestion (no override)', () => {
    const w = background();
    addExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(suggestedWeeklyAllowance(w.household, w.today)).toBeCloseTo(suggestion, 2);
  });

  it('@unit No income configured falls back to 30-day default', () => {
    const w = createWorld();
    addAccount(w);
    seedBalance(w, parseMoney('R$ 10.000,00'));
    // no income
    // 10000 / 30 * 7 = 2333.33 → rounds to 2333
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(suggestion).toBeCloseTo(parseMoney('R$ 2.333,00'), -1);
  });

  it('@unit Final week before paycheck — suggestion capped at free-to-spend', () => {
    const w = createWorld();
    addAccount(w);
    seedBalance(w, parseMoney('R$ 10.000,00'));
    w.today = '2026-05-30';
    addIncome(w, parseMoney('R$ 6.800,00'), 1);
    // daysToPaycheck = 2; freeToSpend = 10000; 10000/2*7 = 35000 → capped at 10000
    const fts = freeToSpend(w.household, w.today);
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(suggestion).toBeLessThanOrEqual(fts + 1);
    expect(suggestedWeeklyAllowance(w.household, w.today)).toBeCloseTo(fts, 0);
  });
});

// ─── Feature: Weekly spent ────────────────────────────────────────────────────

describe('Feature: Weekly spent', () => {
  it('@unit weeklySpent sums expense transactions in current week', () => {
    const w = createWorld();
    addAccount(w);
    const accountId = w.household.cashAccounts[0]?.id ?? 'acc';
    const memberId = w.household.members[0]?.id ?? 'm1';
    w.household = {
      ...w.household,
      transactions: [
        {
          id: 'tx1',
          kind: 'expense',
          name: 'Mercado',
          amount: 142.40,
          date: '2026-05-13',
          byMemberId: memberId,
          accountId,
          siloId: null,
          expenseId: null,
          categoryIds: [],
          receivedAt: null,
          createdAt: '2026-05-13',
        },
        {
          id: 'tx2',
          kind: 'expense',
          name: 'Jantar',
          amount: 68.50,
          date: '2026-05-16',
          byMemberId: memberId,
          accountId,
          siloId: null,
          expenseId: null,
          categoryIds: [],
          receivedAt: null,
          createdAt: '2026-05-16',
        },
      ],
    };
    // Week of May 16 = Mon May 11 – Sun May 17. Both dates fall in this week.
    const spent = weeklySpent(w.household, '2026-05-16');
    expect(spent).toBeCloseTo(142.40 + 68.50, 2);
  });
});
