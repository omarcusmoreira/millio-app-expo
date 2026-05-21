// Thin adapter over commands.ts that auto-generates transaction IDs.
import { monotonicFactory } from 'ulid';
const ulid = monotonicFactory(Math.random);
import {
  markExpensePaid as _markExpensePaid,
  updateSiloValue as _updateSiloValue,
  transferCashToSilo as _transferCashToSilo,
  transferSiloToCash as _transferSiloToCash,
} from './commands';
import type { Expense, Household, ID, Transaction } from './entities';

export const markExpensePaid = (
  h: Household,
  expenseId: ID,
  now: string,
): Household => _markExpensePaid(h, expenseId, now, ulid()).household;

export const updateSiloValue = (
  h: Household,
  siloId: ID,
  newValue: number,
  now: string,
): Household => _updateSiloValue(h, siloId, newValue, now, ulid()).household;

export const addTransfer = (
  h: Household,
  direction: 'to-silo' | 'from-silo',
  amount: number,
  accountId: ID,
  siloId: ID,
  now: string,
): Household =>
  direction === 'to-silo'
    ? _transferCashToSilo(h, siloId, amount, accountId, now, ulid()).household
    : _transferSiloToCash(h, siloId, amount, accountId, now, ulid()).household;

// Add a one-time expense: creates Expense (paidAt = date) + expense Transaction.
export const addOneTimeExpense = (
  h: Household,
  name: string,
  amount: number,
  accountId: ID | null,
  memberId: ID,
  date: string,
  now: string,
): Household => {
  const expenseId = ulid();
  const expense: Expense = {
    id: expenseId,
    name,
    amount,
    estimate: null,
    variable: false,
    date,
    recurring: 'one-time',
    endsAt: null,
    assigneeId: memberId,
    accountId,
    categoryIds: [],
    labelIds: [],
    paidAt: date,
    paidAmount: amount,
    createdAt: now,
    updatedAt: now,
  };
  const tx: Transaction = {
    id: ulid(),
    kind: 'expense',
    name,
    amount,
    date,
    byMemberId: memberId,
    accountId,
    siloId: null,
    expenseId,
    categoryIds: [],
    receivedAt: null,
    createdAt: now,
  };
  return {
    ...h,
    expenses: [...h.expenses, expense],
    transactions: [...h.transactions, tx],
  };
};
