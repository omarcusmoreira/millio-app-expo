// _support/when_then_steps.ts — Skeletons for When/Then steps.
// These show the shape; complete in target codebase.

import { When, Then } from '@amiceli/vitest-cucumber';
import { freeToSpend, suggestedWeeklyAllowance, billStatus } from '@/domain/selectors';
import { markBillPaid, addTransfer, updateSiloValue, addExpense } from '@/domain/actions';
import type { World } from './world';

// ─────────────────────────────────────────────────────────────
// WHEN — user actions
// ─────────────────────────────────────────────────────────────

When<World>('I mark {string} as paid from account {string}', (w, billName, accountName) => {
  const bill = w.household.bills.find(b => b.name === billName)!;
  const account = w.household.cashAccounts.find(a => a.name === accountName)!;
  const amount = bill.amount ?? bill.estimate ?? 0;
  w.household = markBillPaid(w.household, bill.id, amount, account.id, w.today);
});

When<World>('I mark {string} as paid from account {string} with amount {string}',
  (w, billName, accountName, amountStr) => {
    const bill = w.household.bills.find(b => b.name === billName)!;
    const account = w.household.cashAccounts.find(a => a.name === accountName)!;
    w.household = markBillPaid(w.household, bill.id, parseMoney(amountStr), account.id, w.today);
  }
);

When<World>('I transfer {string} from {string} to silo {string}',
  (w, amountStr, accountName, siloName) => {
    const account = w.household.cashAccounts.find(a => a.name === accountName)!;
    const silo = w.household.silos.find(s => s.name === siloName)!;
    w.household = addTransfer(w.household, {
      amount: parseMoney(amountStr), direction: 'to-silo',
      accountId: account.id, siloId: silo.id,
      byMemberId: w.household.members[0].id,
      date: w.today,
    });
  }
);

When<World>('I transfer {string} from silo {string} to {string}',
  (w, amountStr, siloName, accountName) => {
    const silo = w.household.silos.find(s => s.name === siloName)!;
    const account = w.household.cashAccounts.find(a => a.name === accountName)!;
    w.household = addTransfer(w.household, {
      amount: parseMoney(amountStr), direction: 'from-silo',
      accountId: account.id, siloId: silo.id,
      byMemberId: w.household.members[0].id,
      date: w.today,
    });
  }
);

When<World>('I update silo {string} value to {string}',
  (w, siloName, value) => {
    const silo = w.household.silos.find(s => s.name === siloName)!;
    w.household = updateSiloValue(w.household, silo.id, parseMoney(value), w.today);
  }
);

When<World>('I log a spend of {string} from account {string}',
  (w, amount, accountName) => {
    const account = w.household.cashAccounts.find(a => a.name === accountName)!;
    w.household = addExpense(w.household, {
      amount: parseMoney(amount), name: 'Spend',
      accountId: account.id, byMemberId: w.household.members[0].id, date: w.today,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// THEN — assertions
// ─────────────────────────────────────────────────────────────

Then<World>('free-to-spend is {string}', (w, expected) => {
  expect(freeToSpend(w.household, w.today)).toBeCloseTo(parseMoney(expected), 2);
});

Then<World>('free-to-spend is not negative', (w) => {
  expect(freeToSpend(w.household, w.today)).toBeGreaterThanOrEqual(0);
});

Then<World>('silo {string} has value {string}', (w, siloName, expected) => {
  const silo = w.household.silos.find(s => s.name === siloName)!;
  expect(silo.value).toBeCloseTo(parseMoney(expected), 2);
});

Then<World>('bill {string} has status {string}', (w, billName, expected) => {
  const bill = w.household.bills.find(b => b.name === billName)!;
  expect(billStatus(bill, w.today)).toBe(expected);
});

Then<World>('a transaction of kind {string} was recorded', (w, kind) => {
  expect(w.household.transactions.some(t => t.kind === kind)).toBe(true);
});

Then<World>('aggregate net worth is unchanged', (w) => {
  // Compare with the snapshot taken in Given; implementation holds pre/post snapshots
  const totalNow = w.household.transactions.reduce<number>((acc, t) => {
    /* full impl: same logic as cashOnHand */
    return acc;
  }, 0)
    + w.household.silos.reduce((s, x) => s + x.value, 0);
  expect(totalNow).toBeCloseTo((w as any).__baselineNetWorth!, 2);
});

Then<World>('the suggested weekly allowance is {string}', (w, expected) => {
  expect(suggestedWeeklyAllowance(w.household, w.today)).toBeCloseTo(parseMoney(expected), 0);
});

Then<World>('a flash {string} was shown', (w, msg) => {
  expect(w.flashes).toContain(msg);
});

// Helpers ────────────────────────────────────────────────────
function parseMoney(s: string): number {
  const cleaned = s.replace(/[R$\s]/g, '');
  if (/,\d{1,2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(cleaned.replace(/,/g, ''));
}

declare const expect: any;
