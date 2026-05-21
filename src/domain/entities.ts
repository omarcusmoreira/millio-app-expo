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

export interface Expense {
  id: ID;
  name: string;
  amount: number | null;     // null if variable
  estimate: number | null;   // set if variable, null otherwise
  variable: boolean;
  date: string;              // one-time: when paid; recurring: anchor/first due date (ISO YYYY-MM-DD)
  recurring: RecurrenceKind;
  endsAt: string | null;     // ISO; null = repeats indefinitely (recurring only)
  assigneeId: ID;
  accountId: ID | null;
  categoryIds: ID[];
  labelIds: ID[];
  paidAt: string | null;     // one-time: = date at creation; recurring: null until paid
  paidAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Silo {
  id: ID;
  name: string;
  value: number;
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
  | 'asset-update';

export interface Transaction {
  id: ID;
  kind: TransactionKind;
  name: string;
  amount: number;
  date: string; // ISO
  byMemberId: ID;
  accountId: ID | null;
  siloId: ID | null;
  expenseId: ID | null;
  categoryIds: ID[];
  receivedAt: string | null; // income only: null = pending, string = received date
  createdAt: string;
}

export interface Household {
  id: ID;
  name: string | null;
  ownerId: ID;
  members: Member[];
  cashAccounts: CashAccount[];
  categories: Category[];
  labels: Label[];
  expenses: Expense[];
  silos: Silo[];
  incomes: Income[];
  transactions: Transaction[];
  locale: Locale;
  createdAt: string;
}

export type DomainEvent =
  | { type: 'expense.created'; expense: Expense }
  | { type: 'expense.paid'; expenseId: ID; amount: number; accountId: ID | null }
  | { type: 'expense.deleted'; expenseId: ID }
  | { type: 'silo.created'; silo: Silo }
  | { type: 'silo.updated'; siloId: ID; before: number; after: number }
  | {
      type: 'transfer';
      direction: 'to-silo' | 'from-silo';
      amount: number;
      siloId: ID;
      accountId: ID;
    }
  | { type: 'expense'; amount: number; accountId: ID | null }
  | { type: 'income'; amount: number; accountId: ID; memberId: ID }
  | { type: 'member.added'; member: Member }
  | { type: 'member.removed'; memberId: ID }
  | { type: 'locale.changed'; from: Locale; to: Locale };
