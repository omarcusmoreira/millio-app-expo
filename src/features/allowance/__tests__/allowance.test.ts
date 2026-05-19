// Gherkin: allowance/calculation.feature, allowance/adjust.feature, allowance/log-spend.feature
// @unit scenarios (pure domain — no UI)

import { describe, it, expect, beforeEach } from 'vitest';
import type { Income, Transaction } from '../../../domain/entities';
import {
  suggestedWeeklyAllowance,
  effectiveAllowance,
  weeklySpent,
  freeToSpend,
} from '../../../domain/selectors';
import {
  setAllowanceOverride,
  clearAllowanceOverride,
  logAllowanceSpend,
} from '../../../domain/commands';
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
    billId: null,
    categoryIds: [],
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

function addBill(w: World, name: string, amount: number, dueStr: string): void {
  w.household = {
    ...w.household,
    bills: [
      ...w.household.bills,
      {
        id: `bill-${name}`,
        name,
        amount,
        estimate: null,
        variable: false,
        due: parseRelDate(dueStr, w.today),
        recurring: 'monthly' as const,
        assigneeId: w.household.members[0]?.id ?? 'm1',
        categoryIds: [],
        labelIds: [],
        paidAt: null,
        paidAmount: null,
        paidFromAccountId: null,
        createdAt: w.today,
        updatedAt: w.today,
      },
    ],
  };
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
    addBill(w, 'Rent', parseMoney('R$ 2.850,00'), 'in 5 days');
    // free_to_spend = 10000 - 2850 = 7150; today=May16, next=Jun1 → 16 days
    // 7150 / 16 * 7 = 3128.125 → rounds to 3128
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(suggestion).toBeCloseTo(parseMoney('R$ 3.128,00'), -1);
  });

  it('@unit @invariant Inv-6 — suggestion never exceeds free-to-spend', () => {
    const w = background();
    addBill(w, 'Rent', parseMoney('R$ 8.000,00'), 'in 5 days');
    const fts = freeToSpend(w.household, w.today);
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(suggestion).toBeLessThanOrEqual(fts + 1); // +1 for rounding tolerance
  });

  it('@unit Override beats suggestion', () => {
    const w = background();
    w.household = setAllowanceOverride(w.household, parseMoney('R$ 2.050,00'));
    expect(effectiveAllowance(w.household, w.today)).toBeCloseTo(parseMoney('R$ 2.050,00'), 2);
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
    expect(effectiveAllowance(w.household, w.today)).toBeCloseTo(fts, 0);
  });
});

// ─── Feature: Manually adjust the weekly allowance ────────────────────────────

describe('Feature: Manually adjust the weekly allowance', () => {
  it('@unit Setting an override stores the value', () => {
    const w = background();
    w.household = setAllowanceOverride(w.household, parseMoney('R$ 1.500,00'));
    expect(w.household.allowance.override).toBeCloseTo(parseMoney('R$ 1.500,00'), 2);
    expect(effectiveAllowance(w.household, w.today)).toBeCloseTo(parseMoney('R$ 1.500,00'), 2);
  });

  it('@unit Reverting to suggestion clears override', () => {
    const w = background();
    w.household = setAllowanceOverride(w.household, parseMoney('R$ 2.050,00'));
    w.household = clearAllowanceOverride(w.household);
    expect(w.household.allowance.override).toBeNull();
    const suggestion = suggestedWeeklyAllowance(w.household, w.today);
    expect(effectiveAllowance(w.household, w.today)).toBeCloseTo(suggestion, 2);
  });
});

// ─── Feature: Log a weekly spend ──────────────────────────────────────────────

describe('Feature: Log a weekly spend', () => {
  let w: World;

  beforeEach(() => {
    w = createWorld();
    addAccount(w);
    seedBalance(w, parseMoney('R$ 10.000,00'));
    w.household = setAllowanceOverride(w.household, parseMoney('R$ 2.000,00'));
    // Set weekStart to Monday of the current week so dates fall within
    w.household = { ...w.household, allowance: { ...w.household.allowance, weekStart: '2026-05-11' } };
  });

  it('@unit @invariant Spend adds to weeklySpent and drops remaining', () => {
    const result = logAllowanceSpend(
      w.household,
      'Mercado',
      parseMoney('R$ 142,40'),
      w.household.members[0]?.id ?? 'm1',
      w.today,
      'tx-spend-1',
    );
    w.household = result.household;

    const spent = weeklySpent(w.household);
    const effective = effectiveAllowance(w.household, w.today);
    const remaining = Math.max(0, effective - spent);

    expect(spent).toBeCloseTo(parseMoney('R$ 142,40'), 2);
    expect(remaining).toBeCloseTo(parseMoney('R$ 1.857,60'), 2);
    expect(result.household.transactions.some((t) => t.kind === 'allowance-spend')).toBe(true);
  });

  it('@unit Multiple spends sum', () => {
    let r = logAllowanceSpend(w.household, 'Mercado', parseMoney('R$ 142,40'), 'm1', w.today, 'tx-1');
    r = logAllowanceSpend(r.household, 'Jantar', parseMoney('R$ 68,50'), 'm1', w.today, 'tx-2');
    r = logAllowanceSpend(r.household, 'Café', parseMoney('R$ 23,00'), 'm1', w.today, 'tx-3');
    w.household = r.household;

    expect(weeklySpent(w.household)).toBeCloseTo(parseMoney('R$ 233,90'), 2);
    const remaining = Math.max(0, effectiveAllowance(w.household, w.today) - weeklySpent(w.household));
    expect(remaining).toBeCloseTo(parseMoney('R$ 1.766,10'), 2);
  });

  it('@unit Exceeding allowance clamps remaining to 0', () => {
    const r = logAllowanceSpend(w.household, 'Big purchase', parseMoney('R$ 2.500,00'), 'm1', w.today, 'tx-big');
    w.household = r.household;

    const spent = weeklySpent(w.household);
    const effective = effectiveAllowance(w.household, w.today);
    const remaining = Math.max(0, effective - spent);

    expect(spent).toBeCloseTo(parseMoney('R$ 2.500,00'), 2);
    expect(remaining).toBe(0);
  });
});
