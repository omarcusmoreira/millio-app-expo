export type ID = string; // ULID

export type ColorToken = 'terracotta' | 'olive' | 'grey';
export type Locale = 'pt-BR' | 'en-US';

export interface Member {
  id: ID;
  name: string;
  initial: string;
  color: ColorToken;
  joinedAt: string; // ISO
}

export interface CashAccount {
  id: ID;
  name: string;
  ownerId: ID;
}

export interface Category {
  id: ID;
  name: string;
  color: string; // valid hex OR ColorToken
}

export interface Label {
  id: ID;
  name: string;
}

export type RecurrenceKind =
  | 'monthly'
  | 'bi-monthly'
  | 'weekly'
  | 'biweekly'
  | 'yearly'
  | 'one-time';

export interface Bill {
  id: ID;
  name: string;
  amount: number | null;
  estimate: number | null;
  variable: boolean;
  due: string; // ISO YYYY-MM-DD
  recurring: RecurrenceKind;
  assigneeId: ID;
  categoryIds: ID[];
  labelIds: ID[];
  endsAt: string | null; // ISO; null = repeats indefinitely
  paidAt: string | null; // ISO; null = not paid
  paidAmount: number | null;
  paidFromAccountId: ID | null;
  createdAt: string;
  updatedAt: string;
}

export type SiloKind = 'property' | 'savings' | 'equity' | 'vehicle' | 'other';

export interface Silo {
  id: ID;
  name: string;
  value: number;
  kind: SiloKind;
  note: string;
  goalAmount: number | null;
  labelIds: ID[];
  updatedAt: string;
  createdAt: string;
}

export type IncomeSchedule =
  | { kind: 'monthly'; days: [number] }
  | { kind: 'split'; days: [number, number] }
  | { kind: 'biweekly'; days: [number] };

export interface Income {
  id: ID;
  memberId: ID;
  name: string;
  amount: number;
  schedule: IncomeSchedule;
  createdAt: string;
}

export type TransactionKind =
  | 'expense'
  | 'income'
  | 'transfer-in'
  | 'transfer-out'
  | 'asset-update'
  | 'bill-payment'
  | 'allowance-spend';

export interface Transaction {
  id: ID;
  kind: TransactionKind;
  name: string;
  amount: number;
  date: string; // ISO
  byMemberId: ID;
  accountId: ID | null;
  siloId: ID | null;
  billId: ID | null;
  categoryIds: ID[];
  createdAt: string;
}

export interface WeeklyAllowance {
  weekStart: string; // ISO Monday
  override: number | null;
}

export interface Household {
  id: ID;
  name: string | null;
  ownerId: ID;
  members: Member[];
  cashAccounts: CashAccount[];
  categories: Category[];
  labels: Label[];
  bills: Bill[];
  silos: Silo[];
  incomes: Income[];
  transactions: Transaction[];
  allowance: WeeklyAllowance;
  locale: Locale;
  createdAt: string;
}

export type DomainEvent =
  | { type: 'bill.created'; bill: Bill }
  | { type: 'bill.paid'; billId: ID; amount: number; accountId: ID }
  | { type: 'bill.deleted'; billId: ID }
  | { type: 'silo.created'; silo: Silo }
  | { type: 'silo.updated'; siloId: ID; before: number; after: number }
  | {
      type: 'transfer';
      direction: 'to-silo' | 'from-silo';
      amount: number;
      siloId: ID;
      accountId: ID;
    }
  | { type: 'expense'; amount: number; accountId: ID }
  | { type: 'income'; amount: number; accountId: ID; memberId: ID }
  | { type: 'allowance.spent'; amount: number }
  | { type: 'allowance.adjusted'; override: number | null }
  | { type: 'member.added'; member: Member }
  | { type: 'member.removed'; memberId: ID }
  | { type: 'locale.changed'; from: Locale; to: Locale };
