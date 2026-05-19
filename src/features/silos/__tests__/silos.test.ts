// Gherkin: silos/new-silo.feature, silos/transfer.feature, silos/update-value.feature
// @unit and @integration scenarios (pure domain — no UI)

import { describe, it, expect, beforeEach } from 'vitest';
import type { Silo, Transaction } from '../../../domain/entities';
import { cashOnHand, freeToSpend, netWorth } from '../../../domain/selectors';
import {
  transferCashToSilo,
  transferSiloToCash,
  updateSiloValue,
} from '../../../domain/commands';
import { parseMoney, createWorld } from '../../_support/world';

type World = ReturnType<typeof createWorld>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seedBalance(w: World, amount: number): void {
  const accountId = w.household.cashAccounts[0]?.id ?? 'acc';
  const tx: Transaction = {
    id: `seed-${Date.now()}`,
    kind: 'income',
    name: 'Balance seed',
    amount,
    date: w.today,
    byMemberId: w.household.members[0]?.id ?? 'm1',
    accountId,
    siloId: null,
    billId: null,
    categoryIds: [],
    createdAt: w.today,
  };
  w.household = { ...w.household, transactions: [...w.household.transactions, tx] };
}

function addAccount(w: World): string {
  const id = 'acc-itau';
  w.household = {
    ...w.household,
    cashAccounts: [
      { id, name: 'Itaú checking', ownerId: w.household.members[0]?.id ?? 'm1' },
    ],
  };
  return id;
}

function addSilo(w: World, name: string, value: number): Silo {
  const silo: Silo = {
    id: `silo-${name}`,
    name,
    value,
    note: '',
    goalAmount: null,
    labelIds: [],
    createdAt: w.today,
    updatedAt: w.today,
  };
  w.household = { ...w.household, silos: [...w.household.silos, silo] };
  return silo;
}

function background(): World {
  const w = createWorld();
  addAccount(w);
  seedBalance(w, parseMoney('R$ 10.000,00'));
  return w;
}

// ─── Feature: Create a silo ───────────────────────────────────────────────────

describe('Feature: Create a silo', () => {
  it('@integration Empty silo with just a name has initial value 0', () => {
    const w = createWorld();
    const silo = addSilo(w, 'Trip', 0);
    expect(silo.value).toBe(0);
    expect(w.household.silos).toHaveLength(1);
  });

  it('@integration Silo with an initial value does not affect cash', () => {
    const w = background();
    const cashBefore = cashOnHand(w.household);

    addSilo(w, 'Reserve', parseMoney('R$ 5.000,00'));

    expect(cashOnHand(w.household)).toBeCloseTo(cashBefore, 2);
  });

  it('@integration Silo with a goal stores goalAmount', () => {
    const w = createWorld();
    const silo: Silo = {
      id: 'silo-trip',
      name: 'Trip in July',
      value: parseMoney('R$ 2.000,00'),
      note: '',
      goalAmount: parseMoney('R$ 6.000,00'),
      labelIds: [],
      createdAt: w.today,
      updatedAt: w.today,
    };
    w.household = { ...w.household, silos: [silo] };

    const progress = silo.goalAmount != null ? silo.value / silo.goalAmount : 0;
    expect(progress).toBeCloseTo(1 / 3, 2);
    expect(silo.goalAmount).toBeCloseTo(parseMoney('R$ 6.000,00'), 2);
  });
});

// ─── Feature: Transfer between cash and silo ─────────────────────────────────

describe('Feature: Transfer between cash and silo', () => {
  let w: World;
  let accountId: string;
  let silo: Silo;

  beforeEach(() => {
    w = background();
    accountId = 'acc-itau';
    silo = addSilo(w, 'Emergency fund', parseMoney('R$ 5.000,00'));
  });

  it('@unit @invariant To the silo — cash drops, silo rises', () => {
    const netBefore = netWorth(w.household, w.today);
    const result = transferCashToSilo(w.household, silo.id, parseMoney('R$ 1.000,00'), accountId, w.today, 'tx-1');
    w.household = result.household;

    expect(freeToSpend(w.household, w.today)).toBeCloseTo(parseMoney('R$ 9.000,00'), 2);
    expect(w.household.silos.find((s) => s.id === silo.id)?.value).toBeCloseTo(parseMoney('R$ 6.000,00'), 2);
    expect(result.household.transactions.some((t) => t.kind === 'transfer-in')).toBe(true);
    expect(netWorth(w.household, w.today)).toBeCloseTo(netBefore, 2);
  });

  it('@unit @invariant From the silo — cash rises, silo drops', () => {
    const netBefore = netWorth(w.household, w.today);
    const result = transferSiloToCash(w.household, silo.id, parseMoney('R$ 500,00'), accountId, w.today, 'tx-2');
    w.household = result.household;

    expect(freeToSpend(w.household, w.today)).toBeCloseTo(parseMoney('R$ 10.500,00'), 2);
    expect(w.household.silos.find((s) => s.id === silo.id)?.value).toBeCloseTo(parseMoney('R$ 4.500,00'), 2);
    expect(result.household.transactions.some((t) => t.kind === 'transfer-out')).toBe(true);
    expect(netWorth(w.household, w.today)).toBeCloseTo(netBefore, 2);
  });

  it('@unit @property Round-trip is idempotent', () => {
    const cashBefore = cashOnHand(w.household);
    const siloBefore = silo.value;

    const r1 = transferCashToSilo(w.household, silo.id, parseMoney('R$ 1.000,00'), accountId, w.today, 'tx-a');
    const r2 = transferSiloToCash(r1.household, silo.id, parseMoney('R$ 1.000,00'), accountId, w.today, 'tx-b');
    w.household = r2.household;

    expect(cashOnHand(w.household)).toBeCloseTo(cashBefore, 2);
    expect(w.household.silos.find((s) => s.id === silo.id)?.value).toBeCloseTo(siloBefore, 2);
  });

  it('@unit Transfer larger than silo balance is rejected', () => {
    expect(() =>
      transferSiloToCash(w.household, silo.id, parseMoney('R$ 10.000,00'), accountId, w.today, 'tx-x'),
    ).toThrow('insufficient-silo-funds');
    expect(w.household.silos.find((s) => s.id === silo.id)?.value).toBeCloseTo(parseMoney('R$ 5.000,00'), 2);
  });
});

// ─── Feature: Update a silo's value ──────────────────────────────────────────

describe("Feature: Update a silo's value", () => {
  let w: World;
  let silo: Silo;

  beforeEach(() => {
    w = background();
    silo = addSilo(w, 'Apartment', parseMoney('R$ 642.000,00'));
  });

  it('@unit @invariant Raising the value does not touch cash', () => {
    const cashBefore = cashOnHand(w.household);
    const result = updateSiloValue(w.household, silo.id, parseMoney('R$ 654.000,00'), w.today, 'tx-up');
    w.household = result.household;

    expect(w.household.silos.find((s) => s.id === silo.id)?.value).toBeCloseTo(parseMoney('R$ 654.000,00'), 2);
    expect(cashOnHand(w.household)).toBeCloseTo(cashBefore, 2);
    const assetTx = result.household.transactions.find((t) => t.kind === 'asset-update');
    expect(assetTx).toBeDefined();
    expect(assetTx?.amount).toBeCloseTo(parseMoney('R$ 12.000,00'), 2);
  });

  it('@unit @invariant Lowering the value also does not touch cash', () => {
    const cashBefore = cashOnHand(w.household);
    const result = updateSiloValue(w.household, silo.id, parseMoney('R$ 620.000,00'), w.today, 'tx-dn');
    w.household = result.household;

    expect(w.household.silos.find((s) => s.id === silo.id)?.value).toBeCloseTo(parseMoney('R$ 620.000,00'), 2);
    expect(cashOnHand(w.household)).toBeCloseTo(cashBefore, 2);
  });

  it('@unit Setting the same value is a no-op', () => {
    const txCountBefore = w.household.transactions.length;
    const result = updateSiloValue(w.household, silo.id, parseMoney('R$ 642.000,00'), w.today, 'tx-noop');
    w.household = result.household;

    expect(w.household.transactions).toHaveLength(txCountBefore);
    expect(w.household.silos.find((s) => s.id === silo.id)?.updatedAt).toBe(silo.updatedAt);
  });
});
