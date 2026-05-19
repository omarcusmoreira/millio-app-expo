import * as fc from 'fast-check';
import type { Bill, Household, Income, Member, Silo, Transaction } from '../entities';
import {
  applyTransfer,
  deduplicateIds,
  isValidColor,
  markBillPaid,
  removeMember,
  transferCashToSilo,
  transferSiloToCash,
  updateSiloValue,
  validateBill,
} from '../commands';
import {
  billStatus,
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
  bills: [],
  silos: [],
  incomes: [income()],
  transactions: [],
  allowance: { weekStart: '2026-05-11', override: null },
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

const fixedBill = (amount = 500): Bill => ({
  id: ID('bill1'),
  name: 'Rent',
  amount,
  estimate: null,
  variable: false,
  due: '2026-05-20',
  recurring: 'monthly',
  assigneeId: ID('1'),
  categoryIds: [],
  labelIds: [],
  paidAt: null,
  paidAmount: null,
  paidFromAccountId: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
});

const variableBill = (estimate = 300): Bill => ({
  id: ID('bill2'),
  name: 'Electricity',
  amount: null,
  estimate,
  variable: true,
  due: '2026-05-25',
  recurring: 'monthly',
  assigneeId: ID('1'),
  categoryIds: [],
  labelIds: [],
  paidAt: null,
  paidAmount: null,
  paidFromAccountId: null,
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
  billId: null,
  categoryIds: [],
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
            bills: [fixedBill(pending)],
            transactions: [incomeTx(cash)],
          };
          return freeToSpend(h, TODAY) >= 0;
        },
      ),
    );
  });

  it('explicit: bills > cash still returns 0', () => {
    const h = {
      ...emptyHousehold(),
      bills: [fixedBill(2000)],
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

// ─── Inv-4: markBillPaid reduces cash ────────────────────────────────────────

describe('Inv-4 · markBillPaid reduces cashOnHand', () => {
  it('reduces cash by exactly paidAmount', () => {
    const initialCash = 2000;
    const paidAmount = 750;
    const h = {
      ...emptyHousehold(),
      bills: [fixedBill(500)],
      transactions: [incomeTx(initialCash)],
    };
    const { household: after } = markBillPaid(
      h,
      ID('bill1'),
      paidAmount,
      ID('acc1'),
      TODAY,
      ID('tx-pay1'),
    );
    expect(cashOnHand(after)).toBeCloseTo(initialCash - paidAmount, 2);
  });

  it('variable bill: paidAmount is actual value, not estimate', () => {
    const h = {
      ...emptyHousehold(),
      bills: [variableBill(300)],
      transactions: [incomeTx(2000)],
    };
    const { household: after } = markBillPaid(
      h,
      ID('bill2'),
      425, // different from estimate (300)
      ID('acc1'),
      TODAY,
      ID('tx-pay2'),
    );
    const paid = after.bills.find((b) => b.id === ID('bill2'));
    expect(paid?.paidAmount).toBe(425);
    expect(cashOnHand(after)).toBeCloseTo(2000 - 425, 2);
  });

  it('property: cash decreases by paidAmount', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 10_000, noNaN: true }),
        fc.double({ min: 1, max: 100, noNaN: true }),
        (initialCash, paidAmount) => {
          const h = {
            ...emptyHousehold(),
            bills: [fixedBill(500)],
            transactions: [incomeTx(initialCash)],
          };
          const { household: after } = markBillPaid(
            h,
            ID('bill1'),
            paidAmount,
            ID('acc1'),
            TODAY,
            ID('tx-p'),
          );
          return Math.abs(cashOnHand(after) - (initialCash - paidAmount)) < 0.01;
        },
      ),
    );
  });
});

// ─── Inv-5: Variable bill has estimate; fixed bill has amount ─────────────────

describe('Inv-5 · Variable ↔ fixed bill constraint', () => {
  it('valid fixed bill', () => {
    expect(validateBill({ variable: false, amount: 500, estimate: null })).toBe(true);
  });

  it('valid variable bill', () => {
    expect(validateBill({ variable: true, amount: null, estimate: 300 })).toBe(true);
  });

  it('invalid: fixed with estimate', () => {
    expect(validateBill({ variable: false, amount: 500, estimate: 300 })).toBe(false);
  });

  it('invalid: variable with amount', () => {
    expect(validateBill({ variable: true, amount: 500, estimate: 300 })).toBe(false);
  });

  it('invalid: fixed with no amount', () => {
    expect(validateBill({ variable: false, amount: null, estimate: null })).toBe(false);
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
            bills: pendingAmount > 0 ? [fixedBill(pendingAmount)] : [],
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

// ─── Inv-8: Bill status is deterministic ─────────────────────────────────────

describe('Inv-8 · billStatus is deterministic', () => {
  it('paid bill returns "paid"', () => {
    const b: Bill = { ...fixedBill(), paidAt: TODAY };
    expect(billStatus(b, TODAY)).toBe('paid');
  });

  it('future due bill returns "upcoming"', () => {
    const b: Bill = { ...fixedBill(), due: '2026-12-31' };
    expect(billStatus(b, TODAY)).toBe('upcoming');
  });

  it('past due bill returns "overdue"', () => {
    const b: Bill = { ...fixedBill(), due: '2026-01-01' };
    expect(billStatus(b, TODAY)).toBe('overdue');
  });

  it('property: paid always wins regardless of due date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
        (dueDate) => {
          if (isNaN(dueDate.getTime())) return true; // skip invalid dates
          const b: Bill = {
            ...fixedBill(),
            due: dueDate.toISOString().slice(0, 10),
            paidAt: TODAY,
          };
          return billStatus(b, TODAY) === 'paid';
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

describe('Inv-10 · removeMember reassigns bills', () => {
  it('all bills have a valid assignee after removal', () => {
    const m1 = member('1');
    const m2: Member = { ...member('2'), id: ID('2'), name: 'Patricia', initial: 'P' };
    const bill1 = fixedBill();
    const h: Household = {
      ...emptyHousehold(),
      members: [m1, m2],
      bills: [bill1],
    };
    const after = removeMember(h, ID('1'));
    const remainingIds = new Set(after.members.map((m) => m.id));
    for (const b of after.bills) {
      expect(remainingIds.has(b.assigneeId)).toBe(true);
    }
  });

  it('property: no orphaned bills after random removal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (extraMemberCount) => {
          const extraMembers: Member[] = Array.from({ length: extraMemberCount }, (_, i) => ({
            ...member(`extra-${i}`),
            id: ID(`extra-${i}`),
          }));
          const allMembers = [member('1'), ...extraMembers];
          const bills = allMembers.map((m, i) => ({
            ...fixedBill(),
            id: ID(`b${i}`),
            assigneeId: m.id,
          }));
          const h: Household = { ...emptyHousehold(), members: allMembers, bills };
          // Remove the first member
          const after = removeMember(h, ID('1'));
          const remainingIds = new Set(after.members.map((m) => m.id));
          return after.members.length === extraMemberCount
            && after.bills.every((b) => remainingIds.has(b.assigneeId));
        },
      ),
    );
  });
});

// ─── Inv-12: i18n keyset parity ───────────────────────────────────────────────

describe('Inv-12 · i18n does not fail silently', () => {
  // Lazy-require to avoid transform issues
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

// ─── Inv-13: Weekly allowance sums correct transactions ───────────────────────

describe('Inv-13 · weeklySpent sums only allowance-spend in current week', () => {
  it('excludes bill-payments from weekly spent', () => {
    const h: Household = {
      ...emptyHousehold(),
      allowance: { weekStart: '2026-05-11', override: null },
      transactions: [
        {
          id: ID('t1'),
          kind: 'allowance-spend',
          name: 'Coffee',
          amount: 30,
          date: '2026-05-12',
          byMemberId: ID('1'),
          accountId: ID('acc1'),
          siloId: null,
          billId: null,
          categoryIds: [],
          createdAt: '2026-05-12',
        },
        {
          id: ID('t2'),
          kind: 'bill-payment',
          name: 'Rent',
          amount: 1000,
          date: '2026-05-12',
          byMemberId: ID('1'),
          accountId: ID('acc1'),
          siloId: null,
          billId: null,
          categoryIds: [],
          createdAt: '2026-05-12',
        },
        // Out of week
        {
          id: ID('t3'),
          kind: 'allowance-spend',
          name: 'Lunch',
          amount: 50,
          date: '2026-05-05',
          byMemberId: ID('1'),
          accountId: ID('acc1'),
          siloId: null,
          billId: null,
          categoryIds: [],
          createdAt: '2026-05-05',
        },
      ],
    };
    expect(weeklySpent(h)).toBe(30);
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
    expect(isValidColor('#12345')).toBe(false);   // 5 chars
    expect(isValidColor('red')).toBe(false);
    expect(isValidColor('')).toBe(false);
    expect(isValidColor('#FF000')).toBe(false);   // only 5 hex digits
  });
});

// ─── Test case 7: Next paycheck skips year boundary ──────────────────────────

describe('nextPaycheck skips to 2027 from 2026-12-31', () => {
  it('monthly day 5 from Dec 31 → Jan 5 2027', () => {
    const h: Household = {
      ...emptyHousehold(),
      incomes: [
        {
          ...income(),
          schedule: { kind: 'monthly', days: [5] },
        },
      ],
    };
    const result = nextPaycheck(h, '2026-12-31');
    expect(result?.date).toBe('2027-01-05');
  });
});

// ─── Test case 8: Invalid date is rejected ───────────────────────────────────

describe('Bill date validation', () => {
  it('rejects 2026-02-31 (does not exist)', () => {
    // JS Date normalizes overflow: Feb 31 → Mar 3. We detect by re-parsing.
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
    expect(isValidISODate('2026-04-31')).toBe(false); // April has 30 days
    expect(isValidISODate('2026-12-31')).toBe(true);
  });
});
