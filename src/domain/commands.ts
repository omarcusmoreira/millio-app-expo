import type {
  Bill,
  Household,
  ID,
  Silo,
  Transaction,
  TransactionKind,
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

// ─── Mark bill paid (Inv-4) ───────────────────────────────────────────────────

export const markBillPaid = (
  h: Household,
  billId: ID,
  paidAmount: number,
  fromAccountId: ID,
  now: string,
  newTransactionId: ID,
): CommandResult => {
  const bill = h.bills.find((b) => b.id === billId);
  if (!bill) throw new Error(`Bill ${billId} not found`);
  if (bill.paidAt) throw new Error(`Bill ${billId} already paid`);
  if (paidAmount <= 0) throw new Error('amountZero');

  const tx: Transaction = {
    id: newTransactionId,
    kind: 'bill-payment',
    name: bill.name,
    amount: paidAmount,
    date: now,
    byMemberId: bill.assigneeId,
    accountId: fromAccountId,
    siloId: null,
    billId,
    categoryIds: [...bill.categoryIds],
    createdAt: now,
  };

  const updatedBill: Bill = {
    ...bill,
    paidAt: now,
    paidAmount,
    paidFromAccountId: fromAccountId,
    updatedAt: now,
  };

  return {
    household: {
      ...h,
      bills: h.bills.map((b) => (b.id === billId ? updatedBill : b)),
      transactions: [...h.transactions, tx],
    },
    events: [{ type: 'bill.paid', billId, amount: paidAmount, accountId: fromAccountId }],
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
    billId: null,
    categoryIds: [],
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
    billId: null,
    categoryIds: [],
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
    billId: null,
    categoryIds: [],
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
    // Household goes to archived state — out of scope for domain layer
    // Return with no members (caller handles archival)
    return { ...h, members: [] };
  }

  const fallback = remaining[0];
  if (!fallback) return h; // safety

  // Reassign all orphaned bills to the first remaining member
  const reassignedBills = h.bills.map((b) =>
    b.assigneeId === memberId ? { ...b, assigneeId: fallback.id } : b,
  );

  return {
    ...h,
    members: remaining,
    bills: reassignedBills,
  };
};

// ─── Allowance override ───────────────────────────────────────────────────────

export const setAllowanceOverride = (
  h: Household,
  amount: number,
): Household => ({
  ...h,
  allowance: { ...h.allowance, override: amount },
});

export const clearAllowanceOverride = (h: Household): Household => ({
  ...h,
  allowance: { ...h.allowance, override: null },
});

export const logAllowanceSpend = (
  h: Household,
  label: string,
  amount: number,
  byMemberId: ID,
  date: string,
  newTransactionId: ID,
): CommandResult => {
  if (amount <= 0) throw new Error('amountZero');

  const tx: Transaction = {
    id: newTransactionId,
    kind: 'allowance-spend',
    name: label,
    amount,
    date,
    byMemberId,
    accountId: null,
    siloId: null,
    billId: null,
    categoryIds: [],
    createdAt: date,
  };

  return {
    household: { ...h, transactions: [...h.transactions, tx] },
    events: [{ type: 'allowance.spent', amount, label }],
  };
};

// ─── Validate bill (Inv-5) ────────────────────────────────────────────────────

export const validateBill = (
  bill: Pick<Bill, 'variable' | 'amount' | 'estimate'>,
): boolean => {
  if (bill.variable) {
    // Variable bills: amount must be null; estimate may be null (not yet set)
    return bill.amount === null;
  }
  // Fixed bills: amount must be a number, estimate must be null
  return typeof bill.amount === 'number' && bill.estimate === null;
};

// ─── Deduplicate category/label IDs (Inv-14) ─────────────────────────────────

export const deduplicateIds = (ids: ID[]): ID[] =>
  Array.from(new Set(ids));

// ─── Validate color (test case 5) ────────────────────────────────────────────

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const COLOR_TOKENS = new Set(['terracotta', 'olive', 'grey']);

export const isValidColor = (color: string): boolean =>
  HEX_RE.test(color) || COLOR_TOKENS.has(color);
