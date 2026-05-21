// Gherkin: src/features/home/free-to-spend.feature  (@unit scenarios)
// TDD: these tests drive the freeToSpend selector already in domain/selectors.ts

import { describe, it, expect, beforeEach } from 'vitest';
import type { Expense, Transaction } from '../../../domain/entities';
import { freeToSpend } from '../../../domain/selectors';
import { parseMoney, parseRelDate, createWorld } from '../../_support/world';

// ─── Support helpers ──────────────────────────────────────────────────────────

type World = ReturnType<typeof createWorld>;

function addBalance(w: World, accountId: string, amount: number): void {
  const tx: Transaction = {
    id: `seed-${Math.random()}`,
    kind: 'income',
    name: 'Initial balance',
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

function addFixedExpense(w: World, name: string, amount: number, dateStr: string): void {
  const date = parseRelDate(dateStr, w.today);
  const expense: Expense = {
    id: `expense-${name}`,
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
}

function addVariableExpense(w: World, name: string, estimate: number, dateStr: string): void {
  const date = parseRelDate(dateStr, w.today);
  const expense: Expense = {
    id: `expense-${name}`,
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
}

function markExpensePaid(w: World, name: string): void {
  const expense = w.household.expenses.find((e) => e.name === name);
  if (!expense) return;
  const paidAmount = expense.amount ?? expense.estimate ?? 0;
  const accountId = w.household.cashAccounts[0]?.id ?? 'acc';
  const tx: Transaction = {
    id: `pay-${name}`,
    kind: 'expense',
    name: expense.name,
    amount: paidAmount,
    date: w.today,
    byMemberId: expense.assigneeId,
    accountId,
    siloId: null,
    expenseId: expense.id,
    categoryIds: [],
    receivedAt: null,
    createdAt: w.today,
  };
  w.household = {
    ...w.household,
    expenses: w.household.expenses.map((e) =>
      e.name === name ? { ...e, paidAt: w.today, paidAmount } : e,
    ),
    transactions: [...w.household.transactions, tx],
  };
}

// ─── Background setup (same for all scenarios) ────────────────────────────────
// Given today is "2026-05-16"
// And a household with 1 member
// And a bank account "Itaú checking" with "R$ 10.000,00" balance
// And an income of "R$ 6.800,00" for "Marcus" every day 1

function background(): World {
  const w = createWorld(); // today = 2026-05-16, empty household with member

  // Add "Itaú checking" account
  const accountId = 'acc-itau';
  w.household = {
    ...w.household,
    cashAccounts: [{ id: accountId, name: 'Itaú checking', ownerId: w.household.members[0]?.id ?? 'm1' }],
  };
  // Seed balance: R$ 10.000,00 = 10000
  addBalance(w, accountId, parseMoney('R$ 10.000,00'));
  return w;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

describe('Feature: Free to spend', () => {
  // Scenario: No pending expenses, equals cash on hand
  it('@unit No pending expenses — equals cash on hand', () => {
    const w = background();
    // When I compute free-to-spend
    const result = freeToSpend(w.household, w.today);
    // Then free-to-spend is "R$ 10.000,00"
    expect(result).toBe(parseMoney('R$ 10.000,00'));
  });

  // Scenario: With pending expenses, subtracts them
  it('@unit With pending expenses, subtracts them', () => {
    const w = background();
    addFixedExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    addFixedExpense(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');
    const result = freeToSpend(w.household, w.today);
    expect(result).toBeCloseTo(parseMoney('R$ 7.005,00'), 2);
  });

  // Scenario: Never negative (Inv-2)
  it('@unit @invariant Never negative — Inv-2', () => {
    const w = background();
    addFixedExpense(w, 'Rent', parseMoney('R$ 8.000,00'), 'in 5 days');
    addFixedExpense(w, 'Health plan', parseMoney('R$ 4.500,00'), 'in 10 days');
    const result = freeToSpend(w.household, w.today);
    // Then free-to-spend is "R$ 0,00"
    expect(result).toBe(0);
    // And free-to-spend is not negative
    expect(result).toBeGreaterThanOrEqual(0);
  });

  // Scenario: Variable expense uses estimate, not the paid amount
  it('@unit Variable expense uses estimate, not paid amount', () => {
    const w = background();
    addVariableExpense(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');
    const result = freeToSpend(w.household, w.today);
    expect(result).toBeCloseTo(parseMoney('R$ 9.855,00'), 2);
  });

  // Scenario: Paid expense drops out of subtraction
  it('@unit Paid expense drops out of subtraction', () => {
    const w = background();
    addFixedExpense(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    // And expense "Rent" is already paid
    markExpensePaid(w, 'Rent');

    const result = freeToSpend(w.household, w.today);
    expect(result).toBeCloseTo(parseMoney('R$ 7.150,00'), 2);
  });
});
