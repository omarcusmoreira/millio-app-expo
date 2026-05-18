// Gherkin: i18n/formatting.feature
// @unit scenarios — pure formatting functions, no React

import { describe, it, expect } from 'vitest';

// ─── Currency formatting ──────────────────────────────────────────────────────

function formatCurrency(value: number, locale: string): string {
  const currency = locale === 'pt-BR' ? 'BRL' : 'USD';
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(abs) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(abs) ? 0 : 2,
  }).format(abs);
  // Normalize NBSP/NNBSP to regular space for comparison
  return (sign + formatted).replace(/[  ]/g, ' ');
}

describe('Feature: Locale-sensitive formatting — currency', () => {
  it.each([
    ['pt-BR', 1234.56, 'R$ 1.234,56'],
    ['pt-BR', 1234,    'R$ 1.234'],
    ['pt-BR', 0,       'R$ 0'],
    ['pt-BR', -500,    '−R$ 500'],
    ['pt-BR', 1000000, 'R$ 1.000.000'],
    ['en-US', 1234.56, '$1,234.56'],
    ['en-US', 1234,    '$1,234'],
    ['en-US', -500,    '−$500'],
  ] as const)(
    'locale=%s value=%d → %s',
    (locale, value, expected) => {
      expect(formatCurrency(value, locale)).toBe(expected);
    },
  );
});

// ─── Short date formatting ────────────────────────────────────────────────────

function formatShortDate(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  const d = new Date(Date.UTC(year, month - 1, day));
  if (locale === 'pt-BR') {
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
      .replace('.', '');
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

describe('Feature: Locale-sensitive formatting — short date', () => {
  it.each([
    ['pt-BR', '15 de mai'],
    ['en-US', 'May 15'],
  ] as const)(
    'locale=%s → %s',
    (locale, expected) => {
      const result = formatShortDate('2026-05-15', locale);
      expect(result).toBe(expected);
    },
  );
});

// ─── Relative date formatting ─────────────────────────────────────────────────

const TODAY = '2026-05-16';

function formatRelDate(
  iso: string,
  today: string,
  locale: string,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  if (iso === today) return t('bills.due.today');
  const diff = daysBetween(today, iso);
  if (diff === 1) return t('bills.due.tomorrow');
  if (diff === -1) return t('bills.due.yesterday');
  if (diff >= 2 && diff <= 6) return t('bills.due.inDays', { n: diff });
  if (diff <= -2 && diff >= -6) return t('bills.due.lateDays', { n: Math.abs(diff) });
  return formatShortDate(iso, locale);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

const ptBRKeys: Record<string, string | ((o: Record<string, unknown>) => string)> = {
  'bills.due.today': 'hoje',
  'bills.due.tomorrow': 'amanhã',
  'bills.due.yesterday': 'ontem',
  'bills.due.inDays': (o) => `em ${o['n']} dias`,
  'bills.due.lateDays': (o) => `${o['n']} dias atrasada`,
};

const enUSKeys: Record<string, string | ((o: Record<string, unknown>) => string)> = {
  'bills.due.today': 'today',
  'bills.due.tomorrow': 'tomorrow',
  'bills.due.yesterday': 'yesterday',
  'bills.due.inDays': (o) => `in ${o['n']} days`,
  'bills.due.lateDays': (o) => `${o['n']} days late`,
};

function makeT(keys: typeof ptBRKeys) {
  return (k: string, opts?: Record<string, unknown>): string => {
    const v = keys[k];
    if (!v) return k;
    return typeof v === 'function' ? v(opts ?? {}) : v;
  };
}

describe('Feature: Locale-sensitive formatting — relative dates', () => {
  it.each([
    ['pt-BR', '2026-05-16', 'hoje'],
    ['pt-BR', '2026-05-17', 'amanhã'],
    ['pt-BR', '2026-05-15', 'ontem'],
    ['pt-BR', '2026-05-19', 'em 3 dias'],
    ['pt-BR', '2026-05-13', '3 dias atrasada'],
    ['pt-BR', '2026-05-30', '30 de mai'],
    ['en-US', '2026-05-19', 'in 3 days'],
    ['en-US', '2026-05-13', '3 days late'],
  ] as const)(
    'locale=%s date=%s → %s',
    (locale, date, expected) => {
      const keys = locale === 'pt-BR' ? ptBRKeys : enUSKeys;
      const result = formatRelDate(date, TODAY, locale, makeT(keys));
      expect(result).toBe(expected);
    },
  );
});

// ─── "Ago" scales ─────────────────────────────────────────────────────────────

function formatAgo(
  updatedAt: string,
  today: string,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string {
  const diffDays = Math.round(
    (new Date(today + 'T00:00:00Z').getTime() - new Date(updatedAt + 'T00:00:00Z').getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (diffDays < 7) return t('silos.ago.days', { n: diffDays });
  if (diffDays < 30) return t('silos.ago.weeks', { n: Math.round(diffDays / 7) });
  if (diffDays < 365) return t('silos.ago.months', { n: Math.round(diffDays / 30) });
  return t('silos.ago.years', { n: Math.round(diffDays / 365) });
}

const siloKeys: Record<string, (o: Record<string, unknown>) => string> = {
  'silos.ago.days':   (o) => `HÁ ${o['n']}D`,
  'silos.ago.weeks':  (o) => `HÁ ${o['n']}SEM`,
  'silos.ago.months': (o) => `HÁ ${o['n']}M`,
  'silos.ago.years':  (o) => `HÁ ${o['n']}A`,
};

describe('Feature: Locale-sensitive formatting — ago scales', () => {
  const makeAgoT = (k: string, o?: Record<string, unknown>) => siloKeys[k]?.(o ?? {}) ?? k;

  it('3 days ago → HÁ 3D', () => {
    expect(formatAgo('2026-05-13', TODAY, makeAgoT)).toBe('HÁ 3D');
  });
  it('2 weeks ago → HÁ 2SEM', () => {
    expect(formatAgo('2026-05-02', TODAY, makeAgoT)).toBe('HÁ 2SEM');
  });
  it('4 months ago → HÁ 4M', () => {
    expect(formatAgo('2026-01-16', TODAY, makeAgoT)).toBe('HÁ 4M');
  });
  it('2 years ago → HÁ 2A', () => {
    expect(formatAgo('2024-05-16', TODAY, makeAgoT)).toBe('HÁ 2A');
  });
});
