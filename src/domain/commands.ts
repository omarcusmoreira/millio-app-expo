import type {
  Expense,
  Household,
  ID,
  Silo,
  Transaction,
} from './entities';
import { cashOnHand } from './selectors';

export type CommandResult<T = Household> = {
  household: T;
  events: Array<{ type: string } & Record<string, unknown>>;
};

// ─── Transfer helpers (used in Inv-1 property test) ──────────────────────────

export const applyTransfer = (params: {
  direction: 'to-silo' | 'from-silo';
  amount: number;
  cashBefore: number;
  siloBefore: number;
}): { cashAfter: number; siloAfter: number } => {
  if (params.direction === 'to-silo') {
    return {
      cashAfter: params.cashBefore - params.amount,
      siloAfter: params.siloBefore + params.amount,
    };
  }
  return {
    cashAfter: params.cashBefore + params.amount,
    siloAfter: params.siloBefore - params.amount,
  };
};

// ─── Mark expense paid (recurring only) ──────────────────────────────────────

export const markExpensePaid = (
  h: Household,
  expenseId: ID,
  now: string,
  newTransactionId: ID,
): CommandResult => {
  const expense = h.expenses.find((e) => e.id === expenseId);
  if (!expense) throw new Error(`Expense ${expenseId} not found`);
  if (expense.paidAt) throw new Error(`Expense ${expenseId} already paid`);

  const paidAmount = expense.amount ?? expense.estimate ?? 0;
  if (paidAmount <= 0) throw new Error('amountZero');

  const tx: Transaction = {
    id: newTransactionId,
    kind: 'expense',
    name: expense.name,
    amount: paidAmount,
    date: now,
    byMemberId: expense.assigneeId,
    accountId: expense.accountId,
    siloId: null,
    expenseId,
    categoryIds: [...expense.categoryIds],
    receivedAt: null,
    createdAt: now,
  };

  const updatedExpense: Expense = {
    ...expense,
    paidAt: now,
    paidAmount,
    updatedAt: now,
  };

  return {
    household: {
      ...h,
      expenses: h.expenses.map((e) => (e.id === expenseId ? updatedExpense : e)),
      transactions: [...h.transactions, tx],
    },
    events: [{ type: 'expense.paid', expenseId, amount: paidAmount, accountId: expense.accountId }],
  };
};

// ─── Update silo value (Inv-3) ────────────────────────────────────────────────

export const updateSiloValue = (
  h: Household,
  siloId: ID,
  newValue: number,
  now: string,
  newTransactionId: ID,
): CommandResult => {
  const silo = h.silos.find((s) => s.id === siloId);
  if (!silo) throw new Error(`Silo ${siloId} not found`);

  const before = silo.value;
  const delta = newValue - before;

  if (delta === 0) {
    return { household: h, events: [] };
  }

  const tx: Transaction = {
    id: newTransactionId,
    kind: 'asset-update',
    name: silo.name,
    amount: Math.abs(delta),
    date: now,
    byMemberId: h.members[0]?.id ?? '',
    accountId: null,
    siloId,
    expenseId: null,
    categoryIds: [],
    receivedAt: null,
    createdAt: now,
  };

  const updatedSilo: Silo = { ...silo, value: newValue, updatedAt: now };

  return {
    household: {
      ...h,
      silos: h.silos.map((s) => (s.id === siloId ? updatedSilo : s)),
      transactions: [...h.transactions, tx],
    },
    events: [{ type: 'silo.updated', siloId, before, after: newValue }],
  };
};

// ─── Transfer cash ↔ silo (Inv-1) ────────────────────────────────────────────

export const transferCashToSilo = (
  h: Household,
  siloId: ID,
  amount: number,
  fromAccountId: ID,
  now: string,
  newTransactionId: ID,
): CommandResult => {
  const silo = h.silos.find((s) => s.id === siloId);
  if (!silo) throw new Error(`Silo ${siloId} not found`);

  const tx: Transaction = {
    id: newTransactionId,
    kind: 'transfer-in',
    name: `Transfer to ${silo.name}`,
    amount,
    date: now,
    byMemberId: h.members[0]?.id ?? '',
    accountId: fromAccountId,
    siloId,
    expenseId: null,
    categoryIds: [],
    receivedAt: null,
    createdAt: now,
  };

  const updatedSilo: Silo = { ...silo, value: silo.value + amount, updatedAt: now };

  return {
    household: {
      ...h,
      silos: h.silos.map((s) => (s.id === siloId ? updatedSilo : s)),
      transactions: [...h.transactions, tx],
    },
    events: [{ type: 'transfer', direction: 'to-silo', amount, siloId, accountId: fromAccountId }],
  };
};

export const transferSiloToCash = (
  h: Household,
  siloId: ID,
  amount: number,
  toAccountId: ID,
  now: string,
  newTransactionId: ID,
): CommandResult => {
  const silo = h.silos.find((s) => s.id === siloId);
  if (!silo) throw new Error(`Silo ${siloId} not found`);
  if (amount > silo.value) throw new Error('insufficient-silo-funds');

  const tx: Transaction = {
    id: newTransactionId,
    kind: 'transfer-out',
    name: `Transfer from ${silo.name}`,
    amount,
    date: now,
    byMemberId: h.members[0]?.id ?? '',
    accountId: toAccountId,
    siloId,
    expenseId: null,
    categoryIds: [],
    receivedAt: null,
    createdAt: now,
  };

  const updatedSilo: Silo = { ...silo, value: silo.value - amount, updatedAt: now };

  return {
    household: {
      ...h,
      silos: h.silos.map((s) => (s.id === siloId ? updatedSilo : s)),
      transactions: [...h.transactions, tx],
    },
    events: [{ type: 'transfer', direction: 'from-silo', amount, siloId, accountId: toAccountId }],
  };
};

// ─── Remove member (Inv-10) ───────────────────────────────────────────────────

export const removeMember = (
  h: Household,
  memberId: ID,
): Household => {
  const remaining = h.members.filter((m) => m.id !== memberId);
  if (remaining.length === 0) {
    return { ...h, members: [] };
  }

  const fallback = remaining[0];
  if (!fallback) return h;

  const reassignedExpenses = h.expenses.map((e) =>
    e.assigneeId === memberId ? { ...e, assigneeId: fallback.id } : e,
  );

  return {
    ...h,
    members: remaining,
    expenses: reassignedExpenses,
  };
};

// ─── Validate expense (Inv-5) ─────────────────────────────────────────────────

export const validateExpense = (
  expense: Pick<Expense, 'variable' | 'amount' | 'estimate'>,
): boolean => {
  if (expense.variable) {
    return expense.amount === null;
  }
  return typeof expense.amount === 'number' && expense.estimate === null;
};

// ─── Deduplicate category/label IDs (Inv-14) ─────────────────────────────────

export const deduplicateIds = (ids: ID[]): ID[] =>
  Array.from(new Set(ids));

// ─── Validate color (test case 5) ────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const COLOR_TOKENS = new Set(['terracotta', 'olive', 'grey']);

export const isValidColor = (color: string): boolean =>
  HEX_RE.test(color) || COLOR_TOKENS.has(color);
