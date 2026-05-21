// Gherkin: household/members.feature, household/setup.feature
// @unit and @invariant scenarios (pure domain — no UI)

import { describe, it, expect } from 'vitest';
import type { Expense } from '../../../domain/entities';
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

function addExpenseFor(w: World, name: string, assigneeId: string): Expense {
  const expense: Expense = {
    id: `expense-${name}`,
    name,
    amount: 100,
    estimate: null,
    variable: false,
    date: w.today,
    recurring: 'monthly',
    endsAt: null,
    assigneeId,
    accountId: null,
    categoryIds: [],
    labelIds: [],
    paidAt: null,
    paidAmount: null,
    createdAt: w.today,
    updatedAt: w.today,
  };
  w.household = { ...w.household, expenses: [...w.household.expenses, expense] };
  return expense;
}

// ─── Feature: Household members ───────────────────────────────────────────────

describe('Feature: Household members', () => {
  it('@unit @invariant Inv-10 — Removing a member reassigns their expenses', () => {
    const w = createWorld();
    const marcusId = addMember(w, 'Marcus');
    const patriciaId = addMember(w, 'Patricia');
    addMember(w, 'Sofia');
    addExpenseFor(w, 'Rent', marcusId);
    addExpenseFor(w, 'Piano', patriciaId);

    const result = removeMember(w.household, patriciaId);

    const piano = result.expenses.find((e) => e.name === 'Piano');
    expect(piano).toBeDefined();
    expect(piano?.assigneeId).not.toBe(patriciaId);
    expect(piano?.assigneeId).toBe(marcusId); // first remaining member
    expect(result.expenses.every((e) => e.assigneeId !== patriciaId)).toBe(true);
  });

  it('@unit @invariant Inv-10 (edge) — Last member leaves → empty members list', () => {
    const w = createWorld();
    const marcusId = addMember(w, 'Marcus');
    addExpenseFor(w, 'Rent', marcusId);

    const result = removeMember(w.household, marcusId);

    expect(result.members).toHaveLength(0);
    // Expenses keep their assigneeId (not orphaned to null)
    expect(result.expenses[0]?.assigneeId).toBe(marcusId);
  });

  it('@unit No expense is left with a null assigneeId after remove', () => {
    const w = createWorld();
    const marcusId = addMember(w, 'Marcus');
    const patriciaId = addMember(w, 'Patricia');
    addExpenseFor(w, 'Rent', marcusId);
    addExpenseFor(w, 'Piano', patriciaId);
    addExpenseFor(w, 'Electric', patriciaId);

    const result = removeMember(w.household, patriciaId);

    expect(result.expenses.every((e) => typeof e.assigneeId === 'string' && e.assigneeId.length > 0)).toBe(true);
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

  it('@unit Valid color tokens and hex values', () => {
    expect(isValidColor('terracotta')).toBe(true);
    expect(isValidColor('olive')).toBe(true);
    expect(isValidColor('grey')).toBe(true);
    expect(isValidColor('#C26B4D')).toBe(true);
    expect(isValidColor('not-a-color')).toBe(false);
    expect(isValidColor('#ZZZ')).toBe(false);
  });
});
