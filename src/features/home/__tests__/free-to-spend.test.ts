// Gherkin: src/features/home/free-to-spend.feature  (@unit scenarios)
// TDD: these tests drive the freeToSpend selector already in domain/selectors.ts

import { describe, it, expect, beforeEach } from 'vitest';
import type { Bill, Household, Transaction } from '../../../domain/entities';
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
    billId: null,
    categoryIds: [],
    createdAt: w.today,
  };
  w.household = { ...w.household, transactions: [...w.household.transactions, tx] };
}

function addFixedBill(w: World, name: string, amount: number, dueStr: string): void {
  const due = parseRelDate(dueStr, w.today);
  const bill: Bill = {
    id: `bill-${name}`,
    name,
    amount,
    estimate: null,
    variable: false,
    due,
    recurring: 'monthly',
    assigneeId: w.household.members[0]?.id ?? 'm1',
    categoryIds: [],
    labelIds: [],
    paidAt: null,
    paidAmount: null,
    paidFromAccountId: null,
    createdAt: w.today,
    updatedAt: w.today,
  };
  w.household = { ...w.household, bills: [...w.household.bills, bill] };
}

function addVariableBill(w: World, name: string, estimate: number, dueStr: string): void {
  const due = parseRelDate(dueStr, w.today);
  const bill: Bill = {
    id: `bill-${name}`,
    name,
    amount: null,
    estimate,
    variable: true,
    due,
    recurring: 'monthly',
    assigneeId: w.household.members[0]?.id ?? 'm1',
    categoryIds: [],
    labelIds: [],
    paidAt: null,
    paidAmount: null,
    paidFromAccountId: null,
    createdAt: w.today,
    updatedAt: w.today,
  };
  w.household = { ...w.household, bills: [...w.household.bills, bill] };
}

function markBillPaid(w: World, name: string): void {
  const bill = w.household.bills.find((b) => b.name === name);
  if (!bill) return;
  const paidAmount = bill.amount ?? bill.estimate ?? 0;
  const accountId = w.household.cashAccounts[0]?.id ?? 'acc';
  const tx: Transaction = {
    id: `pay-${name}`,
    kind: 'bill-payment',
    name: bill.name,
    amount: paidAmount,
    date: w.today,
    byMemberId: bill.assigneeId,
    accountId,
    siloId: null,
    billId: bill.id,
    categoryIds: [],
    createdAt: w.today,
  };
  w.household = {
    ...w.household,
    bills: w.household.bills.map((b) =>
      b.name === name
        ? { ...b, paidAt: w.today, paidAmount, paidFromAccountId: accountId }
        : b,
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
    cashAccounts: [{ id: accountId, name: 'Itaú checking', ownerId: w.household.members[0]?.id ?? 'm1', last4: '0000' }],
  };
  // Seed balance: R$ 10.000,00 = 10000
  addBalance(w, accountId, parseMoney('R$ 10.000,00'));
  return w;
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

describe('Feature: Free to spend', () => {
  // Scenario: No pending bills, equals cash on hand
  it('@unit No pending bills — equals cash on hand', () => {
    const w = background();
    // When I compute free-to-spend
    const result = freeToSpend(w.household, w.today);
    // Then free-to-spend is "R$ 10.000,00"
    expect(result).toBe(parseMoney('R$ 10.000,00'));
  });

  // Scenario: With pending bills, subtracts them
  it('@unit With pending bills, subtracts them', () => {
    const w = background();
    addFixedBill(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    addFixedBill(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');
    const result = freeToSpend(w.household, w.today);
    expect(result).toBeCloseTo(parseMoney('R$ 7.005,00'), 2);
  });

  // Scenario: Never negative (Inv-2)
  it('@unit @invariant Never negative — Inv-2', () => {
    const w = background();
    addFixedBill(w, 'Rent', parseMoney('R$ 8.000,00'), 'in 5 days');
    addFixedBill(w, 'Health plan', parseMoney('R$ 4.500,00'), 'in 10 days');
    const result = freeToSpend(w.household, w.today);
    // Then free-to-spend is "R$ 0,00"
    expect(result).toBe(0);
    // And free-to-spend is not negative
    expect(result).toBeGreaterThanOrEqual(0);
  });

  // Scenario: Variable bill uses estimate, not the paid amount
  it('@unit Variable bill uses estimate, not paid amount', () => {
    const w = background();
    addVariableBill(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');
    const result = freeToSpend(w.household, w.today);
    expect(result).toBeCloseTo(parseMoney('R$ 9.855,00'), 2);
  });

  // Scenario: Paid bill drops out of subtraction
  it('@unit Paid bill drops out of subtraction', () => {
    const w = background();
    addFixedBill(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    // And bill "Rent" is already paid
    markBillPaid(w, 'Rent');

    const result = freeToSpend(w.household, w.today);
    expect(result).toBeCloseTo(parseMoney('R$ 7.150,00'), 2);
  });
});
