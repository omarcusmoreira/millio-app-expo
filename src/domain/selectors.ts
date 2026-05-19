import type { Bill, Household, Income, IncomeSchedule } from './entities';

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

function makeISODate(year: number, month: number, day: number): string {
  // Handles month-end overflow via Date constructor
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().slice(0, 10);
}

function endOfWeek(weekStart: string): string {
  return addDays(weekStart, 7);
}

// ─── Cash ─────────────────────────────────────────────────────────────────────

export const cashOnHand = (h: Household, today?: string): number =>
  h.transactions.reduce((acc, t) => {
    if (today && t.date > today) return acc;
    switch (t.kind) {
      case 'income':
        return acc + t.amount;
      case 'expense':
      case 'bill-payment':
      case 'allowance-spend':
        return acc - t.amount;
      case 'transfer-in':
        return acc - t.amount; // cash leaves to silo
      case 'transfer-out':
        return acc + t.amount; // cash returns from silo
      case 'asset-update':
        return acc;
    }
  }, 0);

// ─── Bills ────────────────────────────────────────────────────────────────────

export const pendingBills = (h: Household): Bill[] =>
  h.bills.filter((b) => !b.paidAt);

export const totalPending = (h: Household): number =>
  pendingBills(h).reduce((s, b) => s + (b.amount ?? b.estimate ?? 0), 0);

export const billStatus = (
  b: Bill,
  today: string,
): 'paid' | 'upcoming' | 'overdue' => {
  if (b.paidAt) return 'paid';
  return b.due < today ? 'overdue' : 'upcoming';
};

// ─── Free to spend ────────────────────────────────────────────────────────────

export const monthlyIncome = (h: Household): number =>
  h.incomes.reduce((s, i) => s + i.amount, 0);

export const freeToSpend = (h: Household, today: string): number => {
  const cash = cashOnHand(h, today);
  // Only count income transactions that have already been received (date <= today).
  // Future-dated income doesn't count as cash until the day arrives.
  // When no received income transactions exist, fall back to the configured monthly schedules.
  const hasIncomeTx = h.transactions.some((t) => t.kind === 'income' && t.date <= today);
  const base = hasIncomeTx ? cash : monthlyIncome(h);
  return Math.max(0, base - totalPending(h));
};

// ─── Net worth ────────────────────────────────────────────────────────────────

export const netWorth = (h: Household, today: string): number =>
  cashOnHand(h) + h.silos.reduce((s, silo) => s + silo.value, 0);

// ─── Paycheck ─────────────────────────────────────────────────────────────────

function nextPaycheckDate(schedule: IncomeSchedule, today: string): string {
  const parts = today.split('-').map(Number) as [number, number, number];
  const [y, m, d] = parts;

  if (schedule.kind === 'monthly') {
    const payDay = schedule.days[0];
    if (d < payDay) return makeISODate(y, m, payDay);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    return makeISODate(nextY, nextM, payDay);
  }

  if (schedule.kind === 'split') {
    const [d1, d2] = schedule.days;
    if (d < d1) return makeISODate(y, m, d1);
    if (d < d2) return makeISODate(y, m, d2);
    const nextM = m === 12 ? 1 : m + 1;
    const nextY = m === 12 ? y + 1 : y;
    return makeISODate(nextY, nextM, d1);
  }

  // biweekly: every 14 days from anchor
  const anchor = schedule.days[0];
  const anchorStr = makeISODate(y, m, anchor);
  const diff = daysBetween(anchorStr, today);
  if (diff < 0) return anchorStr; // anchor hasn't happened yet this month
  const daysInCycle = diff % 14;
  if (daysInCycle === 0) return addDays(today, 14); // today IS the paycheck day
  return addDays(today, 14 - daysInCycle);
}

export const nextPaycheck = (
  h: Household,
  today: string,
): { date: string; income: Income } | null => {
  if (h.incomes.length === 0) return null;

  // Pick the soonest upcoming paycheck across all incomes
  let soonest: { date: string; income: Income } | null = null;
  for (const income of h.incomes) {
    const date = nextPaycheckDate(income.schedule, today);
    if (!soonest || date < soonest.date) {
      soonest = { date, income };
    }
  }
  return soonest;
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
  h.allowance.override ?? suggestedWeeklyAllowance(h, today);

export const weeklySpent = (h: Household): number => {
  const start = h.allowance.weekStart;
  const end = endOfWeek(start);
  return h.transactions
    .filter(
      (t) =>
        t.kind === 'allowance-spend' && t.date >= start && t.date < end,
    )
    .reduce((s, t) => s + t.amount, 0);
};
