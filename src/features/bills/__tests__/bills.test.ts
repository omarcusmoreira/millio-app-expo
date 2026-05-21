// Gherkin: bills/new-bill.feature, bills/mark-as-paid.feature, bills/list.feature
// @unit and @integration scenarios (pure domain — no UI)

import { describe, it, expect, beforeEach } from 'vitest';
import type { Expense, Transaction } from '../../../domain/entities';
import { expenseStatus, freeToSpend } from '../../../domain/selectors';
import { validateExpense, markExpensePaid as cmdMarkExpensePaid, deduplicateIds } from '../../../domain/commands';
import { parseMoney, parseRelDate, createWorld } from '../../_support/world';

type World = ReturnType<typeof createWorld>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function addFixedExpense(w: World, name: string, amount: number, dateStr: string): Expense {
  const date = parseRelDate(dateStr, w.today);
  const expense: Expense = {
    id: `expense-${name}-${Date.now()}`,
    name,
    amount,
    estimate: null,
    variable: false,
    date,
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
  return expense;
}

function addVariableExpense(w: World, name: string, estimate: number | null, dateStr: string): Expense {
  const date = parseRelDate(dateStr, w.today);
  const expense: Expense = {
    id: `expense-${name}-${Date.now()}`,
    name,
    amount: null,
    estimate,
    variable: true,
    date,
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
  return expense;
}

function payExpense(w: World, expenseId: string, amount: number): void {
  const accountId = w.household.cashAccounts[0]?.id ?? 'acc';
  const expense = w.household.expenses.find((e) => e.id === expenseId)!;
  const tx: Transaction = {
    id: `pay-${expenseId}`,
    kind: 'expense',
    name: expense.name,
    amount,
    date: w.today,
    byMemberId: expense.assigneeId,
    accountId,
    siloId: null,
    expenseId,
    categoryIds: [],
    receivedAt: null,
    createdAt: w.today,
  };
  w.household = {
    ...w.household,
    expenses: w.household.expenses.map((e) =>
      e.id === expenseId
        ? { ...e, paidAt: w.today, paidAmount: amount, accountId }
        : e,
    ),
    transactions: [...w.household.transactions, tx],
  };
}

function background(withBalance = false): World {
  const w = createWorld();
  w.household = {
    ...w.household,
    cashAccounts: [
      { id: 'acc-itau', name: 'Itaú checking', ownerId: w.household.members[0]?.id ?? 'm1' },
    ],
  };
  if (withBalance) seedBalance(w, parseMoney('R$ 10.000,00'));
  return w;
}

// ─── Feature: Add a new obligation ───────────────────────────────────────────

describe('Feature: Add a new obligation', () => {
  it('@integration Fixed recurring expense is added with status upcoming', () => {
    const w = background();
    const expense = addFixedExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');

    expect(w.household.expenses).toHaveLength(1);
    expect(expense.amount).toBeCloseTo(parseMoney('R$ 2.850,00'), 2);
    expect(expense.variable).toBe(false);
    expect(expenseStatus(expense, w.today)).toBe('upcoming');
  });

  it('@integration Variable expense with no estimate does not affect free-to-spend', () => {
    const w = background(true);
    const ftsBefore = freeToSpend(w.household, w.today);

    addVariableExpense(w, 'Electric', null, 'in 3 days');

    const ftsAfter = freeToSpend(w.household, w.today);
    expect(ftsAfter).toBeCloseTo(ftsBefore, 2);
  });

  it('@unit @invariant Inv-5 — variable expense with an amount is invalid', () => {
    expect(validateExpense({ variable: true, amount: 100, estimate: null })).toBe(false);
    expect(validateExpense({ variable: true, amount: 100, estimate: 300 })).toBe(false);
  });

  it('@unit @invariant Inv-5 — fixed expense with no amount is invalid', () => {
    expect(validateExpense({ variable: false, amount: null, estimate: null })).toBe(false);
  });

  it('@unit @invariant Inv-5 — valid combinations pass', () => {
    expect(validateExpense({ variable: false, amount: 2850, estimate: null })).toBe(true);
    expect(validateExpense({ variable: true, amount: null, estimate: 145 })).toBe(true);
    expect(validateExpense({ variable: true, amount: null, estimate: null })).toBe(true);
  });
});

// ─── Feature: Mark an expense as paid ────────────────────────────────────────

describe('Feature: Mark an expense as paid', () => {
  it('@unit Fixed expense — cash drops by exact amount', () => {
    const w = background(true);
    const expense = addFixedExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');

    payExpense(w, expense.id, parseMoney('R$ 2.850,00'));

    expect(expenseStatus(w.household.expenses.find((e) => e.id === expense.id)!, w.today)).toBe('paid');
    expect(freeToSpend(w.household, w.today)).toBeCloseTo(parseMoney('R$ 7.150,00'), 2);
    expect(w.household.transactions.some((t) => t.kind === 'expense')).toBe(true);
  });

  it('@unit Variable expense paidAmount is actual value, not estimate', () => {
    const w = background(true);
    const expense = addVariableExpense(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');

    payExpense(w, expense.id, parseMoney('R$ 167,80'));

    const paid = w.household.expenses.find((e) => e.id === expense.id)!;
    expect(paid.paidAmount).toBeCloseTo(parseMoney('R$ 167,80'), 2);
    expect(freeToSpend(w.household, w.today)).toBeCloseTo(parseMoney('R$ 9.832,20'), 2);
  });

  it('@unit Payment of zero is rejected by command', () => {
    const w = background(true);
    const expense = addFixedExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    expect(() =>
      cmdMarkExpensePaid(w.household, expense.id, w.today, 'tx-zero'),
    ).not.toThrow();
  });
});

// ─── Feature: Expenses list with filters ─────────────────────────────────────

describe('Feature: Expenses list with filters', () => {
  let w: World;

  beforeEach(() => {
    w = background(true);
    addFixedExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    addFixedExpense(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');
    const internet = addFixedExpense(w, 'Internet', parseMoney('R$ 89,00'), 'yesterday');
    payExpense(w, internet.id, parseMoney('R$ 89,00'));
    addFixedExpense(w, 'Piano', parseMoney('R$ 240,00'), '10 days ago');
  });

  it('@integration "All" filter shows every expense', () => {
    expect(w.household.expenses).toHaveLength(4);
  });

  it('@integration "Upcoming" filter shows only unpaid expenses', () => {
    const upcoming = w.household.expenses.filter((e) => !e.paidAt);
    expect(upcoming).toHaveLength(3);
    expect(upcoming.find((e) => e.name === 'Internet')).toBeUndefined();
  });

  it('@integration "Paid" filter shows only paid expenses', () => {
    const paid = w.household.expenses.filter((e) => !!e.paidAt);
    expect(paid).toHaveLength(1);
    expect(paid[0]?.name).toBe('Internet');
  });

  it('@unit @invariant overdue expense — status is overdue', () => {
    const piano = w.household.expenses.find((e) => e.name === 'Piano')!;
    expect(expenseStatus(piano, w.today)).toBe('overdue');
  });

  it.each([
    ['in 5 days', 'upcoming'],
    ['today', 'upcoming'],
    ['tomorrow', 'upcoming'],
    ['yesterday', 'overdue'],
    ['10 days ago', 'overdue'],
  ] as const)(
    '@unit @invariant expense dated "%s" → status "%s"',
    (dateStr, expectedStatus) => {
      const date = parseRelDate(dateStr, w.today);
      const expense: Expense = {
        id: 'test',
        name: 'Test',
        amount: 100,
        estimate: null,
        variable: false,
        date,
        recurring: 'monthly',
        endsAt: null,
        assigneeId: 'm1',
        accountId: null,
        categoryIds: [],
        labelIds: [],
        paidAt: null,
        paidAmount: null,
        createdAt: w.today,
        updatedAt: w.today,
      };
      expect(expenseStatus(expense, w.today)).toBe(expectedStatus);
    },
  );
});
