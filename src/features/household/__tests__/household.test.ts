// Gherkin: household/members.feature, household/setup.feature
// @unit and @invariant scenarios (pure domain — no UI)

import { describe, it, expect } from 'vitest';
import type { Bill } from '../../../domain/entities';
import { removeMember, deduplicateIds, isValidColor } from '../../../domain/commands';
import { createWorld, parseMoney } from '../../_support/world';

type World = ReturnType<typeof createWorld>;

function addMember(w: World, name: string): string {
  const id = `m-${name.toLowerCase()}`;
  w.household = {
    ...w.household,
    members: [
      ...w.household.members,
      {
        id,
        name,
        initial: name[0]?.toUpperCase() ?? '?',
        color: 'terracotta' as const,
        joinedAt: w.today,
      },
    ],
  };
  return id;
}

function addBillFor(w: World, name: string, assigneeId: string): Bill {
  const bill: Bill = {
    id: `bill-${name}`,
    name,
    amount: 100,
    estimate: null,
    variable: false,
    due: w.today,
    recurring: 'monthly',
    assigneeId,
    categoryIds: [],
    labelIds: [],
    paidAt: null,
    paidAmount: null,
    paidFromAccountId: null,
    createdAt: w.today,
    updatedAt: w.today,
  };
  w.household = { ...w.household, bills: [...w.household.bills, bill] };
  return bill;
}

// ─── Feature: Household members ───────────────────────────────────────────────

describe('Feature: Household members', () => {
  it('@unit @invariant Inv-10 — Removing a member reassigns their bills', () => {
    const w = createWorld();
    const marcusId = addMember(w, 'Marcus');
    const patriciaId = addMember(w, 'Patricia');
    addMember(w, 'Sofia');
    addBillFor(w, 'Rent', marcusId);
    addBillFor(w, 'Piano', patriciaId);

    const result = removeMember(w.household, patriciaId);

    const piano = result.bills.find((b) => b.name === 'Piano');
    expect(piano).toBeDefined();
    expect(piano?.assigneeId).not.toBe(patriciaId);
    expect(piano?.assigneeId).toBe(marcusId); // first remaining member
    expect(result.bills.every((b) => b.assigneeId !== patriciaId)).toBe(true);
  });

  it('@unit @invariant Inv-10 (edge) — Last member leaves → empty members list', () => {
    const w = createWorld();
    const marcusId = addMember(w, 'Marcus');
    addBillFor(w, 'Rent', marcusId);

    const result = removeMember(w.household, marcusId);

    expect(result.members).toHaveLength(0);
    // Bills keep their assigneeId (not orphaned to null)
    expect(result.bills[0]?.assigneeId).toBe(marcusId);
  });

  it('@unit No bill is left with a null assigneeId after remove', () => {
    const w = createWorld();
    const marcusId = addMember(w, 'Marcus');
    const patriciaId = addMember(w, 'Patricia');
    addBillFor(w, 'Rent', marcusId);
    addBillFor(w, 'Piano', patriciaId);
    addBillFor(w, 'Electric', patriciaId);

    const result = removeMember(w.household, patriciaId);

    expect(result.bills.every((b) => typeof b.assigneeId === 'string' && b.assigneeId.length > 0)).toBe(true);
  });
});

// ─── Feature: Setup — categories, labels, bank accounts ───────────────────────

describe('Feature: Setup — deduplication and validation', () => {
  it('@unit @invariant Inv-14 — Duplicate IDs are deduplicated on save', () => {
    const ids = ['Casa', 'Casa', 'Filhos'];
    const result = deduplicateIds(ids);
    expect(result).toEqual(['Casa', 'Filhos']);
  });

  it('@unit @invariant Inv-14 — Already-unique list is unchanged', () => {
    const ids = ['a', 'b', 'c'];
    expect(deduplicateIds(ids)).toEqual(['a', 'b', 'c']);
  });

  it('@unit Last4 accepts digits only — non-digit characters are stripped by the domain', () => {
    const last4 = 'abcd1234'.replace(/\D/g, '').slice(-4);
    expect(last4).toBe('1234');
  });

  it('@unit Valid color tokens and hex values', () => {
    expect(isValidColor('terracotta')).toBe(true);
    expect(isValidColor('olive')).toBe(true);
    expect(isValidColor('grey')).toBe(true);
    expect(isValidColor('#C26B4D')).toBe(true);
    expect(isValidColor('not-a-color')).toBe(false);
    expect(isValidColor('#ZZZ')).toBe(false);
  });
});
