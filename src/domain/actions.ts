// Thin adapter over commands.ts that auto-generates transaction IDs.
// Used by Gherkin step definitions and UI mutation handlers.
import { monotonicFactory } from 'ulid';
const ulid = monotonicFactory(Math.random);
import {
  markBillPaid as _markBillPaid,
  updateSiloValue as _updateSiloValue,
  transferCashToSilo as _transferCashToSilo,
  transferSiloToCash as _transferSiloToCash,
} from './commands';
import type { Household, ID, Transaction } from './entities';
import { cashOnHand } from './selectors';

export const markBillPaid = (
  h: Household,
  billId: ID,
  paidAmount: number,
  fromAccountId: ID,
  now: string,
): Household => _markBillPaid(h, billId, paidAmount, fromAccountId, now, ulid()).household;

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

export const addExpense = (
  h: Household,
  amount: number,
  accountId: ID,
  memberId: ID,
  name: string,
  now: string,
): Household => {
  const tx: Transaction = {
    id: ulid(),
    kind: 'allowance-spend',
    name,
    amount,
    date: now,
    byMemberId: memberId,
    accountId,
    siloId: null,
    billId: null,
    categoryIds: [],
    createdAt: now,
  };
  return { ...h, transactions: [...h.transactions, tx] };
};
