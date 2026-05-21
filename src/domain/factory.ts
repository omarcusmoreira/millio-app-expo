import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory(Math.random);
import type { Household } from './entities';

export function buildFreshHousehold(memberName: string): Household {
  const now = new Date().toISOString().slice(0, 10);
  const memberId = ulid();
  const accountId = ulid();

  return {
    id: ulid(),
    name: null,
    ownerId: memberId,
    members: [
      {
        id: memberId,
        name: memberName,
        initial: memberName[0]?.toUpperCase() ?? '?',
        color: 'terracotta',
        joinedAt: now,
      },
    ],
    cashAccounts: [
      {
        id: accountId,
        name: 'Conta principal',
        ownerId: memberId,
      },
    ],
    categories: [],
    labels: [],
    expenses: [],
    silos: [],
    incomes: [],
    transactions: [],
    locale: 'pt-BR',
    createdAt: now,
  };
}
