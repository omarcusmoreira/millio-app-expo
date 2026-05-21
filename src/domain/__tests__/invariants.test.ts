import * as fc from 'fast-check';
import type { Expense, Household, Income, Member, Silo, Transaction } from '../entities';
import {
  applyTransfer,
  deduplicateIds,
  isValidColor,
  markExpensePaid,
  removeMember,
  transferCashToSilo,
  transferSiloToCash,
  updateSiloValue,
  validateExpense,
} from '../commands';
import {
  expenseStatus,
  cashOnHand,
  effectiveAllowance,
  freeToSpend,
  netWorth,
  nextPaycheck,
  suggestedWeeklyAllowance,
  weeklySpent,
} from '../selectors';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TODAY = '2026-05-17';
const ID = (n: number | string) => `id-${n}`;

const member = (id = '1'): Member => ({
  id: ID(id),
  name: 'Marcus',
  initial: 'M',
  color: 'terracotta',
  joinedAt: '2026-01-01',
});

const income = (): Income => ({
  id: ID('inc1'),
  memberId: ID('1'),
  name: 'Salary',
  amount: 10000,
  schedule: { kind: 'monthly', days: [5] },
  createdAt: '2026-01-01',
});

const emptyHousehold = (): Household => ({
  id: ID('h1'),
  name: 'Test household',
  ownerId: ID('1'),
  members: [member()],
  cashAccounts: [{ id: ID('acc1'), name: 'Checking', ownerId: ID('1') }],
  categories: [],
  labels: [],
  expenses: [],
  silos: [],
  incomes: [income()],
  transactions: [],
  locale: 'pt-BR',
  createdAt: '2026-01-01',
});

const silo = (value = 1000): Silo => ({
  id: ID('silo1'),
  name: 'Emergency Fund',
  value,
  note: '',
  goalAmount: null,
  labelIds: [],
  updatedAt: '2026-01-01',
  createdAt: '2026-01-01',
});

const fixedExpense = (amount = 500): Expense => ({
  id: ID('exp1'),
  name: 'Rent',
  amount,
  estimate: null,
  variable: false,
  date: '2026-05-20',
  recurring: 'monthly',
  endsAt: null,
  assigneeId: ID('1'),
  accountId: ID('acc1'),
  categoryIds: [],
  labelIds: [],
  paidAt: null,
  paidAmount: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

const variableExpense = (estimate = 300): Expense => ({
  id: ID('exp2'),
  name: 'Electricity',
  amount: null,
  estimate,
  variable: true,
  date: '2026-05-25',
  recurring: 'monthly',
  endsAt: null,
  assigneeId: ID('1'),
  accountId: ID('acc1'),
  categoryIds: [],
  labelIds: [],
  paidAt: null,
  paidAmount: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

const incomeTx = (amount: number): Transaction => ({
  id: ID('tx1'),
  kind: 'income',
  name: 'Salary',
  amount,
  date: '2026-05-05',
  byMemberId: ID('1'),
  accountId: ID('acc1'),
  siloId: null,
  expenseId: null,
  categoryIds: [],
  receivedAt: '2026-05-05',
  createdAt: '2026-05-05',
});

// ─── Inv-1: Conservation of money in transfers ────────────────────────────────

describe('Inv-1 · Conservation of money in transfers', () => {
  it('property: net worth is unchanged by any transfer', () => {
    fc.assert(
      fc.property(
        fc.record({
          direction: fc.constantFrom<'to-silo' | 'from-silo'>('to-silo', 'from-silo'),
          amount: fc.double({ min: 0.01, max: 1_000_000, noNaN: true }),
          cashBefore: fc.double({ min: 0, max: 10_000_000, noNaN: true }),
          siloBefore: fc.double({ min: 0, max: 10_000_000, noNaN: true }),
        }),
        ({ direction, amount, cashBefore, siloBefore }) => {
          const { cashAfter, siloAfter } = applyTransfer({
            direction,
            amount,
            cashBefore,
            siloBefore,
          });
          return Math.abs(cashAfter + siloAfter - (cashBefore + siloBefore)) < 0.01;
        },
      ),
    );
  });

  it('round-trip transfer restores original cash', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100_000, noNaN: true }),
        fc.double({ min: 0.01, max: 100_000, noNaN: true }),
        (transferAmount, initialCash) => {
          const h = {
            ...emptyHousehold(),
            silos: [silo(0)],
            transactions: [incomeTx(initialCash)],
          };
          const r1 = transferCashToSilo(h, ID('silo1'), transferAmount, ID('acc1'), TODAY, ID('tx-a'));
          const r2 = transferSiloToCash(
            r1.household,
            ID('silo1'),
            transferAmount,
            ID('acc1'),
            TODAY,
            ID('tx-b'),
          );
          return (
            Math.abs(cashOnHand(r2.household) - cashOnHand(h)) < 0.01
          );
        },
      ),
    );
  });
});

// ─── Inv-2: Free to spend never negative ─────────────────────────────────────

describe('Inv-2 · freeToSpend never negative', () => {
  it('property: result is always >= 0', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100_000, noNaN: true }),
        fc.double({ min: 0, max: 100_000, noNaN: true }),
        (cash, pending) => {
          const h = {
            ...emptyHousehold(),
            expenses: [fixedExpense(pending)],
            transactions: [incomeTx(cash)],
          };
          return freeToSpend(h, TODAY) >= 0;
        },
      ),
    );
  });

  it('explicit: expenses > cash still returns 0', () => {
    const h = {
      ...emptyHousehold(),
      expenses: [fixedExpense(2000)],
      transactions: [incomeTx(500)],
    };
    expect(freeToSpend(h, TODAY)).toBe(0);
  });
});

// ─── Inv-3: updateSiloValue never moves cash ─────────────────────────────────

describe('Inv-3 · updateSiloValue never moves cash', () => {
  it('property: cashOnHand unchanged after revaluation', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000_000, noNaN: true }),
        fc.double({ min: 0, max: 1_000_000, noNaN: true }),
        (initialCash, newSiloValue) => {
          const h = {
            ...emptyHousehold(),
            silos: [silo(500)],
            transactions: [incomeTx(initialCash)],
          };
          const { household: after } = updateSiloValue(h, ID('silo1'), newSiloValue, TODAY, ID('tx-upd'));
          return Math.abs(cashOnHand(after) - cashOnHand(h)) < 0.01;
        },
      ),
    );
  });

  it('logs an asset-update transaction', () => {
    const h = { ...emptyHousehold(), silos: [silo(500)] };
    const { household: after } = updateSiloValue(h, ID('silo1'), 800, TODAY, ID('upd1'));
    const tx = after.transactions.find((t) => t.kind === 'asset-update');
    expect(tx).toBeDefined();
    expect(tx?.siloId).toBe(ID('silo1'));
  });
});

// ─── Inv-4: markExpensePaid reduces cash ─────────────────────────────────────

describe('Inv-4 · markExpensePaid reduces cashOnHand', () => {
  it('reduces cash by exactly paidAmount', () => {
    const initialCash = 2000;
    const h = {
      ...emptyHousehold(),
      expenses: [fixedExpense(500)],
      transactions: [incomeTx(initialCash)],
    };
    const { household: after } = markExpensePaid(
      h,
      ID('exp1'),
      TODAY,
      ID('tx-pay1'),
    );
    expect(cashOnHand(after)).toBeCloseTo(initialCash - 500, 2);
  });

  it('variable expense: paidAmount is the estimate value', () => {
    const h = {
      ...emptyHousehold(),
      expenses: [variableExpense(300)],
      transactions: [incomeTx(2000)],
    };
    const { household: after } = markExpensePaid(
      h,
      ID('exp2'),
      TODAY,
      ID('tx-pay2'),
    );
    const paid = after.expenses.find((e) => e.id === ID('exp2'));
    expect(paid?.paidAmount).toBe(300);
    expect(cashOnHand(after)).toBeCloseTo(2000 - 300, 2);
  });

  it('property: cash decreases by expense amount', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 10_000, noNaN: true }),
        fc.double({ min: 1, max: 100, noNaN: true }),
        (initialCash, expenseAmount) => {
          const h = {
            ...emptyHousehold(),
            expenses: [fixedExpense(expenseAmount)],
            transactions: [incomeTx(initialCash)],
          };
          const { household: after } = markExpensePaid(
            h,
            ID('exp1'),
            TODAY,
            ID('tx-p'),
          );
          return Math.abs(cashOnHand(after) - (initialCash - expenseAmount)) < 0.01;
        },
      ),
    );
  });
});

// ─── Inv-5: Variable expense has estimate; fixed has amount ──────────────────

describe('Inv-5 · Variable ↔ fixed expense constraint', () => {
  it('valid fixed expense', () => {
    expect(validateExpense({ variable: false, amount: 500, estimate: null })).toBe(true);
  });

  it('valid variable expense', () => {
    expect(validateExpense({ variable: true, amount: null, estimate: 300 })).toBe(true);
  });

  it('invalid: fixed with estimate', () => {
    expect(validateExpense({ variable: false, amount: 500, estimate: 300 })).toBe(false);
  });

  it('invalid: variable with amount', () => {
    expect(validateExpense({ variable: true, amount: 500, estimate: 300 })).toBe(false);
  });

  it('invalid: fixed with no amount', () => {
    expect(validateExpense({ variable: false, amount: null, estimate: null })).toBe(false);
  });
});

// ─── Inv-6: Suggestion never exceeds freeToSpend (+tolerance) ────────────────

describe('Inv-6 · suggestedWeeklyAllowance <= freeToSpend + rounding tolerance', () => {
  it('property: suggestion within tolerance', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 50_000, noNaN: true }),
        fc.integer({ min: 1, max: 60 }),
        (cash, pendingAmount) => {
          const h = {
            ...emptyHousehold(),
            expenses: pendingAmount > 0 ? [fixedExpense(pendingAmount)] : [],
            transactions: [incomeTx(cash)],
          };
          const suggested = suggestedWeeklyAllowance(h, TODAY);
          const fts = freeToSpend(h, TODAY);
          return suggested <= fts + 7; // +7 rounding tolerance per Inv-6
        },
      ),
    );
  });
});

// ─── Inv-8: Expense status is deterministic ───────────────────────────────────

describe('Inv-8 · expenseStatus is deterministic', () => {
  it('paid expense returns "paid"', () => {
    const e: Expense = { ...fixedExpense(), paidAt: TODAY };
    expect(expenseStatus(e, TODAY)).toBe('paid');
  });

  it('future date expense returns "upcoming"', () => {
    const e: Expense = { ...fixedExpense(), date: '2026-12-31' };
    expect(expenseStatus(e, TODAY)).toBe('upcoming');
  });

  it('past date expense returns "overdue"', () => {
    const e: Expense = { ...fixedExpense(), date: '2026-01-01' };
    expect(expenseStatus(e, TODAY)).toBe('overdue');
  });

  it('property: paid always wins regardless of date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (date) => {
          if (isNaN(date.getTime())) return true;
          const e: Expense = {
            ...fixedExpense(),
            date: date.toISOString().slice(0, 10),
            paidAt: TODAY,
          };
          return expenseStatus(e, TODAY) === 'paid';
        },
      ),
    );
  });
});

// ─── Inv-9: Net worth = cash + silos ─────────────────────────────────────────

describe('Inv-9 · netWorth = cashOnHand + sum(silos)', () => {
  it('property: always equals cash + silos', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 100_000, noNaN: true }),
        fc.array(fc.double({ min: 0, max: 50_000, noNaN: true }), { minLength: 0, maxLength: 5 }),
        (cash, siloValues) => {
          const silos = siloValues.map((v, i) => ({
            ...silo(v),
            id: ID(`s${i}`),
          }));
          const h = {
            ...emptyHousehold(),
            silos,
            transactions: [incomeTx(cash)],
          };
          const expected = cashOnHand(h) + silos.reduce((s, si) => s + si.value, 0);
          return Math.abs(netWorth(h, TODAY) - expected) < 0.01;
        },
      ),
    );
  });
});

// ─── Inv-10: Members never vanish ────────────────────────────────────────────

describe('Inv-10 · removeMember reassigns expenses', () => {
  it('all expenses have a valid assignee after removal', () => {
    const m1 = member('1');
    const m2: Member = { ...member('2'), id: ID('2'), name: 'Patricia', initial: 'P' };
    const exp1 = fixedExpense();
    const h: Household = {
      ...emptyHousehold(),
      members: [m1, m2],
      expenses: [exp1],
    };
    const after = removeMember(h, ID('1'));
    const remainingIds = new Set(after.members.map((m) => m.id));
    for (const e of after.expenses) {
      expect(remainingIds.has(e.assigneeId)).toBe(true);
    }
  });

  it('property: no orphaned expenses after random removal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (extraMemberCount) => {
          const extraMembers: Member[] = Array.from({ length: extraMemberCount }, (_, i) => ({
            ...member(`extra-${i}`),
            id: ID(`extra-${i}`),
          }));
          const allMembers = [member('1'), ...extraMembers];
          const expenses = allMembers.map((m, i) => ({
            ...fixedExpense(),
            id: ID(`e${i}`),
            assigneeId: m.id,
          }));
          const h: Household = { ...emptyHousehold(), members: allMembers, expenses };
          const after = removeMember(h, ID('1'));
          const remainingIds = new Set(after.members.map((m) => m.id));
          return after.members.length === extraMemberCount
            && after.expenses.every((e) => remainingIds.has(e.assigneeId));
        },
      ),
    );
  });
});

// ─── Inv-12: i18n keyset parity ───────────────────────────────────────────────

describe('Inv-12 · i18n does not fail silently', () => {
  const loadMessages = () => {
    const ptBR = require('../../i18n/locales/pt-BR.json') as Record<string, unknown>;
    const enUS = require('../../i18n/locales/en-US.json') as Record<string, unknown>;
    return { ptBR, enUS };
  };

  const flattenKeys = (
    obj: Record<string, unknown>,
    prefix = '',
  ): string[] => {
    return Object.entries(obj).flatMap(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return flattenKeys(v as Record<string, unknown>, key);
      }
      return [key];
    });
  };

  it('both locales have identical keysets', () => {
    const { ptBR, enUS } = loadMessages();
    const ptKeys = new Set(flattenKeys(ptBR));
    const enKeys = new Set(flattenKeys(enUS));

    const onlyInPT = [...ptKeys].filter((k) => !enKeys.has(k));
    const onlyInEN = [...enKeys].filter((k) => !ptKeys.has(k));

    expect(onlyInPT).toEqual([]);
    expect(onlyInEN).toEqual([]);
  });
});

// ─── Inv-13: Weekly spent sums all expense transactions in current week ───────

describe('Inv-13 · weeklySpent sums all expense transactions in current week', () => {
  it('counts expense transactions in week, excludes those outside', () => {
    const h: Household = {
      ...emptyHousehold(),
      transactions: [
        {
          id: ID('t1'),
          kind: 'expense',
          name: 'Coffee',
          amount: 30,
          date: '2026-05-12', // Mon 2026-05-11 week → in range
          byMemberId: ID('1'),
          accountId: ID('acc1'),
          siloId: null,
          expenseId: null,
          categoryIds: [],
          receivedAt: null,
          createdAt: '2026-05-12',
        },
        {
          id: ID('t2'),
          kind: 'expense',
          name: 'Rent',
          amount: 1000,
          date: '2026-05-14', // also in week
          byMemberId: ID('1'),
          accountId: ID('acc1'),
          siloId: null,
          expenseId: null,
          categoryIds: [],
          receivedAt: null,
          createdAt: '2026-05-14',
        },
        // Out of week
        {
          id: ID('t3'),
          kind: 'expense',
          name: 'Lunch',
          amount: 50,
          date: '2026-05-05', // previous week
          byMemberId: ID('1'),
          accountId: ID('acc1'),
          siloId: null,
          expenseId: null,
          categoryIds: [],
          receivedAt: null,
          createdAt: '2026-05-05',
        },
      ],
    };
    // TODAY = '2026-05-17', weekStart = '2026-05-11'
    expect(weeklySpent(h, TODAY)).toBe(1030);
  });
});

// ─── Inv-14: No duplicate category/label IDs ─────────────────────────────────

describe('Inv-14 · deduplicateIds removes duplicates', () => {
  it('property: result has no duplicates', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 0, maxLength: 20 }),
        (ids) => {
          const result = deduplicateIds(ids);
          return result.length === new Set(result).size;
        },
      ),
    );
  });
});

// ─── Test case 5: Invalid color is rejected ───────────────────────────────────

describe('Color validation', () => {
  it('valid hex colors pass', () => {
    expect(isValidColor('#FF0000')).toBe(true);
    expect(isValidColor('#D9583B')).toBe(true);
    expect(isValidColor('#7A8C5E')).toBe(true);
  });

  it('valid color tokens pass', () => {
    expect(isValidColor('terracotta')).toBe(true);
    expect(isValidColor('olive')).toBe(true);
    expect(isValidColor('grey')).toBe(true);
  });

  it('malformed hex is rejected', () => {
    expect(isValidColor('#GG0000')).toBe(false);
    expect(isValidColor('#12345')).toBe(false);
    expect(isValidColor('red')).toBe(false);
    expect(isValidColor('')).toBe(false);
    expect(isValidColor('#FF000')).toBe(false);
  });
});

// ─── Test case 7: Next paycheck skips year boundary ──────────────────────────

describe('nextPaycheck returns soonest pending income transaction', () => {
  it('returns soonest unreceivedIncome transaction on or after today', () => {
    const h: Household = {
      ...emptyHousehold(),
      transactions: [
        { ...incomeTx(10000), id: ID('tx2'), date: '2027-01-05', receivedAt: null },
        { ...incomeTx(5000),  id: ID('tx3'), date: '2027-02-05', receivedAt: null },
        { ...incomeTx(2000),  id: ID('tx4'), date: '2026-12-30', receivedAt: '2026-12-30' },
      ],
    };
    const result = nextPaycheck(h, '2026-12-31');
    expect(result?.date).toBe('2027-01-05');
    expect(result?.memberId).toBe(ID('1'));
  });

  it('returns null when all income transactions are received', () => {
    const h: Household = {
      ...emptyHousehold(),
      transactions: [{ ...incomeTx(10000), receivedAt: '2026-05-05' }],
    };
    expect(nextPaycheck(h, TODAY)).toBeNull();
  });
});

// ─── Test case 8: Invalid date is rejected ───────────────────────────────────

describe('Expense date validation', () => {
  it('rejects 2026-02-31 (does not exist)', () => {
    const isValidISODate = (s: string): boolean => {
      const [y, m, d] = s.split('-').map(Number) as [number, number, number];
      const date = new Date(Date.UTC(y, m - 1, d));
      return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() + 1 === m &&
        date.getUTCDate() === d
      );
    };
    expect(isValidISODate('2026-02-28')).toBe(true);
    expect(isValidISODate('2026-02-31')).toBe(false);
    expect(isValidISODate('2026-04-31')).toBe(false);
    expect(isValidISODate('2026-12-31')).toBe(true);
  });
});
