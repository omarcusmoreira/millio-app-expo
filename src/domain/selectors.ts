import type { Expense, Household } from './entities';

// ─── Date helpers (pure, no external deps) ───────────────────────────────────

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function currentWeekMonday(today: string): string {
  const d = new Date(today + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ─── Cash ─────────────────────────────────────────────────────────────────────

export const cashOnHand = (h: Household, today?: string): number =>
  h.transactions.reduce((acc, t) => {
    if (today && t.date > today) return acc;
    switch (t.kind) {
      case 'income':
        // receivedAt === null means pending; undefined handles pre-migration data (treat as received)
        if (t.receivedAt === null) return acc;
        return acc + t.amount;
      case 'expense':
        return acc - t.amount;
      case 'transfer-in':
        return acc - t.amount;
      case 'transfer-out':
        return acc + t.amount;
      case 'asset-update':
        return acc;
    }
  }, 0);

// ─── Expenses ─────────────────────────────────────────────────────────────────

function clampDay(day: number, year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCMonth() !== month - 1) return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function expenseOccurrencesInMonth(expense: Expense, year: number, month: number): string[] {
  const anchor = new Date(expense.date + 'T00:00:00Z');
  const anchorYear = anchor.getUTCFullYear();
  const anchorMonth = anchor.getUTCMonth() + 1;
  const anchorDay = anchor.getUTCDate();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEndExcl = new Date(Date.UTC(year, month, 1));

  switch (expense.recurring) {
    case 'one-time':
      return [];
    case 'monthly': {
      if (year < anchorYear || (year === anchorYear && month < anchorMonth)) return [];
      return [clampDay(anchorDay, year, month)];
    }
    case 'bi-monthly': {
      const diff = (year - anchorYear) * 12 + (month - anchorMonth);
      if (diff < 0 || diff % 2 !== 0) return [];
      return [clampDay(anchorDay, year, month)];
    }
    case 'yearly':
      if (month !== anchorMonth || year < anchorYear) return [];
      return [clampDay(anchorDay, year, month)];
    case 'weekly': {
      const result: string[] = [];
      const d = new Date(expense.date + 'T00:00:00Z');
      while (d < monthStart) d.setUTCDate(d.getUTCDate() + 7);
      while (d < monthEndExcl) {
        const iso = d.toISOString().slice(0, 10);
        if (!expense.endsAt || iso <= expense.endsAt) result.push(iso);
        d.setUTCDate(d.getUTCDate() + 7);
      }
      return result;
    }
    case 'biweekly': {
      const result: string[] = [];
      const d = new Date(expense.date + 'T00:00:00Z');
      while (d < monthStart) d.setUTCDate(d.getUTCDate() + 14);
      while (d < monthEndExcl) {
        const iso = d.toISOString().slice(0, 10);
        if (!expense.endsAt || iso <= expense.endsAt) result.push(iso);
        d.setUTCDate(d.getUTCDate() + 14);
      }
      return result;
    }
  }
}

export const pendingExpenses = (h: Household): Expense[] =>
  h.expenses.filter((e) => e.recurring !== 'one-time' && !e.paidAt);

export const totalPending = (h: Household): number =>
  pendingExpenses(h).reduce((s, e) => s + (e.amount ?? e.estimate ?? 0), 0);

export const totalPendingThisMonth = (h: Household, today: string): number => {
  const [year, month] = today.split('-').map(Number) as [number, number];
  return pendingExpenses(h).reduce((s, e) => {
    const count = expenseOccurrencesInMonth(e, year, month).length;
    return s + count * (e.amount ?? e.estimate ?? 0);
  }, 0);
};

export function upcomingOccurrences(
  h: Household,
  today: string,
  limit = 8,
): Array<{ expense: Expense; date: string }> {
  const [year, month] = today.split('-').map(Number) as [number, number];
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const rows: Array<{ expense: Expense; date: string }> = [];

  for (const expense of pendingExpenses(h)) {
    for (const y of [year, nextYear]) {
      const m = y === year ? month : nextMonth;
      for (const date of expenseOccurrencesInMonth(expense, y, m)) {
        if (date >= today) rows.push({ expense, date });
      }
      if (rows.length >= limit * 2) break;
    }
  }

  return rows
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export const expenseStatus = (
  e: Expense,
  today: string,
): 'paid' | 'upcoming' | 'overdue' => {
  if (e.paidAt) return 'paid';
  return e.date < today ? 'overdue' : 'upcoming';
};

// ─── Free to spend ────────────────────────────────────────────────────────────

export const monthlyIncome = (h: Household): number =>
  h.incomes.reduce((s, i) => s + i.amount, 0);

export const freeToSpend = (h: Household, today: string): number => {
  const cash = cashOnHand(h, today);
  const hasReceivedIncome = h.transactions.some(
    (t) => t.kind === 'income' && t.receivedAt != null && t.date <= today,
  );
  const base = hasReceivedIncome ? cash : monthlyIncome(h);
  return Math.max(0, base - totalPendingThisMonth(h, today));
};

// ─── Net worth ────────────────────────────────────────────────────────────────

export const netWorth = (h: Household, today: string): number =>
  cashOnHand(h) + h.silos.reduce((s, silo) => s + silo.value, 0);

// ─── Paycheck ─────────────────────────────────────────────────────────────────

export const nextPaycheck = (
  h: Household,
  today: string,
): { date: string; memberId: string; name: string } | null => {
  const pending = h.transactions.filter(
    (t) => t.kind === 'income' && t.receivedAt === null && t.date >= today,
  );
  if (pending.length === 0) return null;
  const soonest = pending.reduce((a, b) => (a.date <= b.date ? a : b));
  return { date: soonest.date, memberId: soonest.byMemberId, name: soonest.name };
};

export const daysUntilPaycheck = (h: Household, today: string): number => {
  const np = nextPaycheck(h, today);
  return np ? Math.max(0, daysBetween(today, np.date)) : 30;
};

// ─── Allowance ────────────────────────────────────────────────────────────────

export const suggestedWeeklyAllowance = (
  h: Household,
  today: string,
): number => {
  const fts = freeToSpend(h, today);
  const dtp = daysUntilPaycheck(h, today);
  const raw = Math.round((fts / Math.max(1, dtp)) * 7);
  return Math.min(raw, fts);
};

export const effectiveAllowance = (h: Household, today: string): number =>
  suggestedWeeklyAllowance(h, today);

export const weeklySpent = (h: Household, today: string): number => {
  const start = currentWeekMonday(today);
  const end = addDays(start, 7);
  return h.transactions
    .filter((t) => t.kind === 'expense' && t.date >= start && t.date < end)
    .reduce((s, t) => s + t.amount, 0);
};
