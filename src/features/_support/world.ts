// _support/world.ts — Shared test context for all Gherkin steps.
// Implementation skeleton; complete in target codebase.

import type { Household, Bill, Silo, Member, Income, Transaction } from '@/domain/types';

export interface World {
  /** ISO date "today" — overridable per scenario via `Given today is "YYYY-MM-DD"`. */
  today: string;
  /** In-memory household. Reset between scenarios. */
  household: Household;
  /** Captured domain events since the `When` step started. */
  events: import('@/domain/events').DomainEvent[];
  /** UI snapshot for assertions that span domain → display (use sparingly). */
  rendered: { tree: unknown; texts: string[] } | null;
  /** Captured flash/toast messages. */
  flashes: string[];
  /** Captured navigation pushes ("home", "bills/123", etc.). */
  navTo: string[];
  /** i18n locale active for the scenario. */
  locale: 'pt-BR' | 'en-US';
}

export const createWorld = (): World => ({
  today: '2026-05-16',
  household: emptyHousehold(),
  events: [],
  rendered: null,
  flashes: [],
  navTo: [],
  locale: 'pt-BR',
});

// Helpers ────────────────────────────────────────────────────
export const emptyHousehold = (): Household => ({
  id: 'h1',
  name: null,
  ownerId: '',
  members: [], cashAccounts: [], categories: [], labels: [],
  bills: [], silos: [], incomes: [], transactions: [],
  allowance: { weekStart: '2026-05-11', override: null },
  locale: 'pt-BR',
  createdAt: '2026-05-01T00:00:00Z',
});

// Money parsers — handles both "R$ 1.234,56" and "$1,234.56"
export const parseMoney = (s: string): number => {
  const cleaned = s.replace(/[R$\s]/g, '');
  // pt-BR uses . for thousands and , for decimal
  if (/,\d{1,2}$/.test(cleaned)) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
  }
  // en-US uses , for thousands and . for decimal
  return parseFloat(cleaned.replace(/,/g, ''));
};

// Date parsers — "in 3 days", "today", "yesterday", "tomorrow", "3 days ago", ISO
export const parseRelDate = (s: string, today: string): string => {
  if (s === 'today') return today;
  if (s === 'tomorrow') return addDays(today, 1);
  if (s === 'yesterday') return addDays(today, -1);
  let m = s.match(/in (\d+) days?/);
  if (m) return addDays(today, parseInt(m[1] ?? '0', 10));
  m = s.match(/(\d+) days? ago/);
  if (m) return addDays(today, -parseInt(m[1] ?? '0', 10));
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  throw new Error(`Cannot parse date: "${s}"`);
};

const addDays = (iso: string, d: number): string => {
  const dt = new Date(iso + 'T12:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + d);
  return dt.toISOString().slice(0, 10);
};
