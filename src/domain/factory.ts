import { monotonicFactory } from 'ulid';

const ulid = monotonicFactory(Math.random);
import type { Household } from './entities';

export function buildFreshHousehold(memberName: string): Household {
  const now = new Date().toISOString().slice(0, 10);
  const memberId = ulid();
  const accountId = ulid();

  // Monday of the current week
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const daysFromMonday = (day === 0 ? 6 : day - 1);
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysFromMonday);
  const weekStart = monday.toISOString().slice(0, 10);

  return {
    id: ulid(),
    name: null,
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
        last4: '0000',
      },
    ],
    categories: [],
    labels: [],
    bills: [],
    silos: [],
    incomes: [],
    transactions: [],
    allowance: { weekStart, override: null },
    locale: 'pt-BR',
    createdAt: now,
  };
}
