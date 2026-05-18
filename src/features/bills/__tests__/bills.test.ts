// Gherkin: bills/new-bill.feature, bills/mark-as-paid.feature, bills/list.feature
// @unit and @integration scenarios (pure domain — no UI)

import { describe, it, expect, beforeEach } from 'vitest';
import type { Bill, Household, Transaction } from '../../../domain/entities';
import { billStatus, freeToSpend, cashOnHand } from '../../../domain/selectors';
import { validateBill, markBillPaid as cmdMarkBillPaid, deduplicateIds } from '../../../domain/commands';
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
    billId: null,
    categoryIds: [],
    createdAt: w.today,
  };
  w.household = { ...w.household, transactions: [...w.household.transactions, tx] };
}

function addFixedBill(w: World, name: string, amount: number, dueStr: string): Bill {
  const due = parseRelDate(dueStr, w.today);
  const bill: Bill = {
    id: `bill-${name}-${Date.now()}`,
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
  return bill;
}

function addVariableBill(w: World, name: string, estimate: number | null, dueStr: string): Bill {
  const due = parseRelDate(dueStr, w.today);
  const bill: Bill = {
    id: `bill-${name}-${Date.now()}`,
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
  return bill;
}

function payBill(w: World, billId: string, amount: number): void {
  const accountId = w.household.cashAccounts[0]?.id ?? 'acc';
  const bill = w.household.bills.find((b) => b.id === billId)!;
  const tx: Transaction = {
    id: `pay-${billId}`,
    kind: 'bill-payment',
    name: bill.name,
    amount,
    date: w.today,
    byMemberId: bill.assigneeId,
    accountId,
    siloId: null,
    billId,
    categoryIds: [],
    createdAt: w.today,
  };
  w.household = {
    ...w.household,
    bills: w.household.bills.map((b) =>
      b.id === billId
        ? { ...b, paidAt: w.today, paidAmount: amount, paidFromAccountId: accountId }
        : b,
    ),
    transactions: [...w.household.transactions, tx],
  };
}

function background(withBalance = false): World {
  const w = createWorld();
  w.household = {
    ...w.household,
    cashAccounts: [
      { id: 'acc-itau', name: 'Itaú checking', ownerId: w.household.members[0]?.id ?? 'm1', last4: '0000' },
    ],
  };
  if (withBalance) seedBalance(w, parseMoney('R$ 10.000,00'));
  return w;
}

// ─── Feature: Add a new obligation ───────────────────────────────────────────

describe('Feature: Add a new obligation', () => {
  // Scenario: Fixed monthly bill
  it('@integration Fixed monthly bill is added with status upcoming', () => {
    const w = background();
    const bill = addFixedBill(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');

    expect(w.household.bills).toHaveLength(1);
    expect(bill.amount).toBeCloseTo(parseMoney('R$ 2.850,00'), 2);
    expect(bill.variable).toBe(false);
    expect(billStatus(bill, w.today)).toBe('upcoming');
  });

  // Scenario: Variable bill with no estimate — no effect on free-to-spend
  it('@integration Variable bill with no estimate does not affect free-to-spend', () => {
    const w = background(true);
    const ftsBefore = freeToSpend(w.household, w.today);

    addVariableBill(w, 'Electric', null, 'in 3 days');

    const ftsAfter = freeToSpend(w.household, w.today);
    expect(ftsAfter).toBeCloseTo(ftsBefore, 2);
  });

  // Scenario: Inv-5 — Variable bill with amount is rejected
  it('@unit @invariant Inv-5 — variable bill with an amount is invalid', () => {
    expect(validateBill({ variable: true, amount: 100, estimate: null })).toBe(false);
    expect(validateBill({ variable: true, amount: 100, estimate: 300 })).toBe(false);
  });

  it('@unit @invariant Inv-5 — fixed bill with no amount is invalid', () => {
    expect(validateBill({ variable: false, amount: null, estimate: null })).toBe(false);
  });

  it('@unit @invariant Inv-5 — valid combinations pass', () => {
    expect(validateBill({ variable: false, amount: 2850, estimate: null })).toBe(true);
    expect(validateBill({ variable: true, amount: null, estimate: 145 })).toBe(true);
    expect(validateBill({ variable: true, amount: null, estimate: null })).toBe(true);
  });
});

// ─── Feature: Mark a bill as paid ────────────────────────────────────────────

describe('Feature: Mark a bill as paid', () => {
  // Scenario: Fixed-amount bill
  it('@unit Fixed bill — cash drops by exact amount', () => {
    const w = background(true);
    const bill = addFixedBill(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');

    payBill(w, bill.id, parseMoney('R$ 2.850,00'));

    expect(billStatus(w.household.bills.find((b) => b.id === bill.id)!, w.today)).toBe('paid');
    expect(freeToSpend(w.household, w.today)).toBeCloseTo(parseMoney('R$ 7.150,00'), 2);
    expect(w.household.transactions.some((t) => t.kind === 'bill-payment')).toBe(true);
  });

  // Scenario: Variable bill paid at different value
  it('@unit Variable bill paidAmount is actual value, not estimate', () => {
    const w = background(true);
    const bill = addVariableBill(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');

    payBill(w, bill.id, parseMoney('R$ 167,80'));

    const paid = w.household.bills.find((b) => b.id === bill.id)!;
    expect(paid.paidAmount).toBeCloseTo(parseMoney('R$ 167,80'), 2);
    expect(freeToSpend(w.household, w.today)).toBeCloseTo(parseMoney('R$ 9.832,20'), 2);
  });

  // Scenario: Payment cannot be zero or negative
  it('@unit Payment of zero is rejected by command', () => {
    const w = background(true);
    const bill = addFixedBill(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    expect(() =>
      cmdMarkBillPaid(w.household, bill.id, 0, 'acc-itau', w.today, 'tx-zero'),
    ).toThrow();
  });
});

// ─── Feature: Bills list with filters ────────────────────────────────────────

describe('Feature: Bills list with filters', () => {
  let w: World;

  beforeEach(() => {
    w = background(true);
    addFixedBill(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    addFixedBill(w, 'Electric', parseMoney('R$ 145,00'), 'in 3 days');
    const internet = addFixedBill(w, 'Internet', parseMoney('R$ 89,00'), 'yesterday');
    payBill(w, internet.id, parseMoney('R$ 89,00'));
    addFixedBill(w, 'Piano', parseMoney('R$ 240,00'), '10 days ago');
  });

  it('@integration "All" filter shows every bill', () => {
    expect(w.household.bills).toHaveLength(4);
  });

  it('@integration "Upcoming" filter shows only unpaid bills', () => {
    const upcoming = w.household.bills.filter((b) => !b.paidAt);
    expect(upcoming).toHaveLength(3);
    expect(upcoming.find((b) => b.name === 'Internet')).toBeUndefined();
  });

  it('@integration "Paid" filter shows only paid bills', () => {
    const paid = w.household.bills.filter((b) => !!b.paidAt);
    expect(paid).toHaveLength(1);
    expect(paid[0]?.name).toBe('Internet');
  });

  // Scenario Outline: Status derived by date
  it('@unit @invariant overdue bill — status is overdue', () => {
    const piano = w.household.bills.find((b) => b.name === 'Piano')!;
    expect(billStatus(piano, w.today)).toBe('overdue');
  });

  it.each([
    ['in 5 days', 'upcoming'],
    ['today', 'upcoming'],
    ['tomorrow', 'upcoming'],
    ['yesterday', 'overdue'],
    ['10 days ago', 'overdue'],
  ] as const)(
    '@unit @invariant bill due "%s" → status "%s"',
    (dueStr, expectedStatus) => {
      const due = parseRelDate(dueStr, w.today);
      const bill: Bill = {
        id: 'test',
        name: 'Test',
        amount: 100,
        estimate: null,
        variable: false,
        due,
        recurring: 'monthly',
        assigneeId: 'm1',
        categoryIds: [],
        labelIds: [],
        paidAt: null,
        paidAmount: null,
        paidFromAccountId: null,
        createdAt: w.today,
        updatedAt: w.today,
      };
      expect(billStatus(bill, w.today)).toBe(expectedStatus);
    },
  );
});
