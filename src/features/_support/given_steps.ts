// _support/given_steps.ts — Step definitions for "Given…" preambles.
// Skeleton — adapt to the cucumber/vitest-cucumber syntax of choice.

import { Given } from '@amiceli/vitest-cucumber';
import type { World } from './world';
import { ulid } from 'ulid';

// ─────────────────────────────────────────────────────────────
// Time
// ─────────────────────────────────────────────────────────────
Given<World>('today is {string}', (w, today: string) => {
  w.today = today;
});

// ─────────────────────────────────────────────────────────────
// Household and members
// ─────────────────────────────────────────────────────────────
Given<World>('a household with {int} members', (w, count: number) => {
  for (let i = 0; i < count; i++) {
    w.household.members.push({
      id: `m${i + 1}`,
      name: ['Marcus', 'Patricia', 'Sofia'][i] ?? `Member ${i + 1}`,
      initial: (['Marcus', 'Patricia', 'Sofia'][i] ?? `M${i}`)[0].toUpperCase(),
      color: (['terracotta', 'olive', 'grey'] as const)[i % 3],
      joinedAt: w.today,
    });
  }
});

Given<World>('member {string} with color {string}', (w, name: string, color: string) => {
  w.household.members.push({
    id: ulid(), name, initial: name[0].toUpperCase(),
    color: color as 'terracotta' | 'olive' | 'grey',
    joinedAt: w.today,
  });
});

// ─────────────────────────────────────────────────────────────
// Bills
// ─────────────────────────────────────────────────────────────
Given<World>('a bill {string} of {string} due {string}', (w, name, amount, when) => {
  w.household.bills.push({
    id: ulid(), name, amount: parseMoney(amount), estimate: null, variable: false,
    due: parseRelDate(when, w.today), recurring: 'monthly',
    assigneeId: w.household.members[0]?.id ?? 'm1',
    categoryIds: [], labelIds: [],
    paidAt: null, paidAmount: null, paidFromAccountId: null,
    createdAt: w.today, updatedAt: w.today,
  });
});

Given<World>('a variable bill {string} estimated at {string} due {string}',
  (w, name, est, when) => {
    w.household.bills.push({
      id: ulid(), name, amount: null, estimate: parseMoney(est), variable: true,
      due: parseRelDate(when, w.today), recurring: 'monthly',
      assigneeId: w.household.members[0]?.id ?? 'm1',
      categoryIds: [], labelIds: [],
      paidAt: null, paidAmount: null, paidFromAccountId: null,
      createdAt: w.today, updatedAt: w.today,
    });
  }
);

Given<World>('bill {string} is already paid', (w, name) => {
  const bill = w.household.bills.find(b => b.name === name);
  if (!bill) throw new Error(`Bill not found: ${name}`);
  bill.paidAt = w.today;
  bill.paidAmount = bill.amount ?? bill.estimate ?? 0;
  bill.paidFromAccountId = w.household.cashAccounts[0]?.id ?? null;
});

Given<World>('bill {string} is assigned to {string}', (w, billName, memberName) => {
  const bill = w.household.bills.find(b => b.name === billName);
  const member = w.household.members.find(m => m.name === memberName);
  if (!bill || !member) throw new Error('Bill or member not found');
  bill.assigneeId = member.id;
});

// ─────────────────────────────────────────────────────────────
// Silos
// ─────────────────────────────────────────────────────────────
Given<World>('a silo {string} with {string}', (w, name, amount) => {
  w.household.silos.push({
    id: ulid(), name, value: parseMoney(amount),
    note: '', goalAmount: null,
    updatedAt: w.today, createdAt: w.today,
  });
});

// ─────────────────────────────────────────────────────────────
// Bank accounts
// ─────────────────────────────────────────────────────────────
Given<World>('a bank account {string} with {string} balance', (w, name, balance) => {
  const account = { id: ulid(), name, ownerId: w.household.members[0]?.id ?? 'm1' };
  w.household.cashAccounts.push(account);
  // Seed cash via initial income txn (so the cashOnHand selector returns it)
  w.household.transactions.push({
    id: ulid(), kind: 'income', name: 'Initial balance', amount: parseMoney(balance),
    date: w.today, byMemberId: account.ownerId, accountId: account.id,
    siloId: null, expenseId: null, categoryIds: [], receivedAt: w.today, createdAt: w.today,
  });
});

// ─────────────────────────────────────────────────────────────
// Income
// ─────────────────────────────────────────────────────────────
Given<World>('an income of {string} for {string} every day {int}',
  (w, amount, memberName, day) => {
    const member = w.household.members.find(m => m.name === memberName);
    if (!member) throw new Error(`Member not found: ${memberName}`);
    w.household.incomes.push({
      id: ulid(), memberId: member.id, name: `Salary ${memberName}`,
      amount: parseMoney(amount),
      schedule: { kind: 'monthly', days: [day] },
      createdAt: w.today,
    });
  }
);

// ─────────────────────────────────────────────────────────────
// Locale
// ─────────────────────────────────────────────────────────────
Given<World>('the UI in {string}', (w, locale) => {
  w.locale = locale as 'pt-BR' | 'en-US';
  w.household.locale = w.locale;
});

// Helpers ────────────────────────────────────────────────────
function parseMoney(s: string): number {
  const cleaned = s.replace(/[R$\s]/g, '');
  if (/,\d{1,2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(cleaned.replace(/,/g, ''));
}

function parseRelDate(s: string, today: string): string {
  if (s === 'today') return today;
  if (s === 'tomorrow') return addDays(today, 1);
  if (s === 'yesterday') return addDays(today, -1);
  let m = s.match(/in (\d+) days?/);  if (m) return addDays(today, +m[1]);
  m = s.match(/(\d+) days? ago/);     if (m) return addDays(today, -+m[1]);
  return s;
}

function addDays(iso: string, d: number): string {
  const dt = new Date(iso + 'T12:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + d);
  return dt.toISOString().slice(0, 10);
}
