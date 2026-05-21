import type { Household } from '../domain/entities';

// Canonical mock household — Lar dos Carvalho.
// Mirrors the prototype's data.js so every screen has realistic data.
// Used only in __DEV__ mode (see app/index.tsx).

export const MOCK_HOUSEHOLD: Household = {
  id: 'mock-household-01',
  name: 'Lar dos Carvalho',
  ownerId: 'm1',
  locale: 'pt-BR',
  createdAt: '2026-01-01',

  members: [
    { id: 'm1', name: 'Marcos',   initial: 'M', color: 'terracotta', joinedAt: '2026-01-01' },
    { id: 'm2', name: 'Patrícia', initial: 'P', color: 'olive',      joinedAt: '2026-01-01' },
    { id: 'm3', name: 'Rafael',   initial: 'R', color: 'grey',       joinedAt: '2026-02-01' },
    { id: 'm4', name: 'Beatriz',  initial: 'B', color: 'grey',       joinedAt: '2026-03-01' },
  ],

  cashAccounts: [
    { id: 'a1', name: 'Itaú corrente',   ownerId: 'm1' },
    { id: 'a2', name: 'Nubank conjunta', ownerId: 'm2' },
    { id: 'a3', name: 'Itaú crédito',    ownerId: 'm1' },
  ],

  categories: [
    { id: 'c1', name: 'Casa',        color: '#8B6F47' },
    { id: 'c2', name: 'Filhos',      color: '#5C7C9A' },
    { id: 'c3', name: 'Assinaturas', color: '#7A5D9F' },
    { id: 'c4', name: 'Seguros',     color: '#4A7A6B' },
    { id: 'c5', name: 'Carro',       color: '#9F6244' },
    { id: 'c6', name: 'Serviços',    color: '#B85C82' },
  ],

  labels: [
    { id: 'l1', name: 'Débito automático' },
    { id: 'l2', name: 'Recorrente' },
    { id: 'l3', name: 'Valor variável' },
    { id: 'l4', name: 'Dedutível' },
  ],

  // May 2026 — mix of paid / upcoming / overdue.
  // Expenses b1-b4 are paid (paidAt set + expense transactions).
  // b7 Piano da Sofia is overdue (date 2026-05-15, today 2026-05-18).
  expenses: [
    // March 2026 — all paid (history)
    { id: 'mr1b1', name: 'Aluguel',        amount: 2850, estimate: null, variable: false, date:'2026-03-01', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: '2026-03-01', paidAmount: 2850, accountId: 'a1', createdAt: '2026-01-01', updatedAt: '2026-03-01' },
    { id: 'mr1b2', name: 'Internet (Vivo)',amount: 89,   estimate: null, variable: false, date:'2026-03-04', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1', 'l2'], paidAt: '2026-03-04', paidAmount: 89,   accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-03-04' },
    { id: 'mr1b3', name: 'Netflix',        amount: 24,   estimate: null, variable: false, date:'2026-03-07', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c3'],  labelIds: ['l1', 'l2'], paidAt: '2026-03-07', paidAmount: 24,   accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-03-07' },
    { id: 'mr1b4', name: 'Seguro do carro',amount: 184,  estimate: null, variable: false, date:'2026-03-10', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c5'],  labelIds: [],           paidAt: '2026-03-10', paidAmount: 184,  accountId: 'a3', createdAt: '2026-01-01', updatedAt: '2026-03-10' },
    { id: 'mr1b5', name: 'Luz (Enel)',     amount: 118,  estimate: null, variable: true,  date:'2026-03-18', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c6'],  labelIds: ['l3'],       paidAt: '2026-03-19', paidAmount: 118,  accountId: 'a1', createdAt: '2026-01-01', updatedAt: '2026-03-19' },
    { id: 'mr1b6', name: 'Condomínio',     amount: 420,  estimate: null, variable: false, date:'2026-03-30', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: '2026-03-30', paidAmount: 420,  accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-03-30' },

    // April 2026 — all paid (history)
    { id: 'a1b1', name: 'Aluguel',        amount: 2850, estimate: null, variable: false, date:'2026-04-01', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: '2026-04-01', paidAmount: 2850, accountId: 'a1', createdAt: '2026-01-01', updatedAt: '2026-04-01' },
    { id: 'a1b2', name: 'Internet (Vivo)',amount: 89,   estimate: null, variable: false, date:'2026-04-04', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1', 'l2'], paidAt: '2026-04-04', paidAmount: 89,   accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-04-04' },
    { id: 'a1b3', name: 'Netflix',        amount: 24,   estimate: null, variable: false, date:'2026-04-07', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c3'],  labelIds: ['l1', 'l2'], paidAt: '2026-04-07', paidAmount: 24,   accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-04-07' },
    { id: 'a1b4', name: 'Seguro do carro',amount: 184,  estimate: null, variable: false, date:'2026-04-10', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c5'],  labelIds: [],           paidAt: '2026-04-10', paidAmount: 184,  accountId: 'a3', createdAt: '2026-01-01', updatedAt: '2026-04-10' },
    { id: 'a1b5', name: 'Luz (Enel)',     amount: 132,  estimate: null, variable: true,  date:'2026-04-18', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c6'],  labelIds: ['l3'],       paidAt: '2026-04-20', paidAmount: 132,  accountId: 'a1', createdAt: '2026-01-01', updatedAt: '2026-04-20' },
    { id: 'a1b6', name: 'Condomínio',     amount: 420,  estimate: null, variable: false, date:'2026-04-30', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: '2026-04-30', paidAmount: 420,  accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-04-30' },

    // June 2026 — all upcoming (projection)
    { id: 'j1b1', name: 'Aluguel',        amount: 2850, estimate: null, variable: false, date:'2026-06-01', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'j1b2', name: 'Internet (Vivo)',amount: 89,   estimate: null, variable: false, date:'2026-06-04', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1', 'l2'], paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'j1b3', name: 'Netflix',        amount: 24,   estimate: null, variable: false, date:'2026-06-07', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c3'],  labelIds: ['l1', 'l2'], paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'j1b4', name: 'Seguro do carro',amount: 184,  estimate: null, variable: false, date:'2026-06-10', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c5'],  labelIds: [],           paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'j1b5', name: 'Luz (Enel)',     amount: null, estimate: 145, variable: true,   date:'2026-06-18', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c6'],  labelIds: ['l3'],       paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'j1b6', name: 'Condomínio',     amount: 420,  estimate: null, variable: false, date:'2026-06-30', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },

    // July 2026 — all upcoming (projection)
    { id: 'jl1b1', name: 'Aluguel',        amount: 2850, estimate: null, variable: false, date:'2026-07-01', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'jl1b2', name: 'Internet (Vivo)',amount: 89,   estimate: null, variable: false, date:'2026-07-04', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1', 'l2'], paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'jl1b3', name: 'Netflix',        amount: 24,   estimate: null, variable: false, date:'2026-07-07', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c3'],  labelIds: ['l1', 'l2'], paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'jl1b4', name: 'Seguro do carro',amount: 184,  estimate: null, variable: false, date:'2026-07-10', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c5'],  labelIds: [],           paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'jl1b5', name: 'Luz (Enel)',     amount: null, estimate: 150, variable: true,   date:'2026-07-18', recurring: 'monthly',  endsAt: null, assigneeId: 'm1', categoryIds: ['c6'],  labelIds: ['l3'],       paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'jl1b6', name: 'Condomínio',     amount: 420,  estimate: null, variable: false, date:'2026-07-30', recurring: 'monthly',  endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],  labelIds: ['l1'],       paidAt: null, paidAmount: null, accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },

    // May 2026
    { id: 'b1',  name: 'Aluguel',            amount: 2850,  estimate: null,  variable: false, date:'2026-05-01', recurring: 'monthly',    endsAt: null, assigneeId: 'm1', categoryIds: ['c1'],       labelIds: ['l1'],       paidAt: '2026-05-01', paidAmount: 2850,  accountId: 'a1', createdAt: '2026-01-01', updatedAt: '2026-05-01' },
    { id: 'b2',  name: 'Internet (Vivo)',     amount: 89,    estimate: null,  variable: false, date:'2026-05-04', recurring: 'monthly',    endsAt: null, assigneeId: 'm2', categoryIds: ['c1', 'c6'], labelIds: ['l1', 'l2'], paidAt: '2026-05-04', paidAmount: 89,    accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-05-04' },
    { id: 'b3',  name: 'Netflix',             amount: 24,    estimate: null,  variable: false, date:'2026-05-07', recurring: 'monthly',    endsAt: null, assigneeId: 'm2', categoryIds: ['c3'],       labelIds: ['l1', 'l2'], paidAt: '2026-05-07', paidAmount: 24,    accountId: 'a2', createdAt: '2026-01-01', updatedAt: '2026-05-07' },
    { id: 'b4',  name: 'Seguro do carro',     amount: 184,   estimate: null,  variable: false, date:'2026-05-10', recurring: 'monthly',    endsAt: null, assigneeId: 'm1', categoryIds: ['c4', 'c5'], labelIds: [],           paidAt: '2026-05-10', paidAmount: 184,   accountId: 'a3', createdAt: '2026-01-01', updatedAt: '2026-05-10' },
    { id: 'b5',  name: 'Luz (Enel)',          amount: null,  estimate: 145,   variable: true,  date:'2026-05-18', recurring: 'monthly',    endsAt: null, assigneeId: 'm1', categoryIds: ['c6'],       labelIds: ['l3'],       paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'b6',  name: 'Água (Sabesp)',       amount: null,  estimate: 90,    variable: true,  date:'2026-05-22', recurring: 'bi-monthly', endsAt: null, assigneeId: 'm2', categoryIds: ['c6'],       labelIds: ['l3'],       paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'b7',  name: 'Piano da Sofia',      amount: 240,   estimate: null,  variable: false, date:'2026-05-15', recurring: 'monthly',    endsAt: null, assigneeId: 'm2', categoryIds: ['c2'],       labelIds: [],           paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'b8',  name: 'Spotify família',     amount: 17,    estimate: null,  variable: false, date:'2026-05-23', recurring: 'monthly',    endsAt: null, assigneeId: 'm1', categoryIds: ['c3'],       labelIds: ['l1', 'l2'], paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'b9',  name: 'Gás (Comgás)',        amount: null,  estimate: 75,    variable: true,  date:'2026-05-25', recurring: 'monthly',    endsAt: null, assigneeId: 'm1', categoryIds: ['c6'],       labelIds: ['l3'],       paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'b10', name: 'Academia',            amount: 38,    estimate: null,  variable: false, date:'2026-05-28', recurring: 'monthly',    endsAt: null, assigneeId: 'm2', categoryIds: [],           labelIds: ['l1'],       paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'b11', name: 'iCloud',              amount: 9.99,  estimate: null,  variable: false, date:'2026-05-29', recurring: 'monthly',    endsAt: null, assigneeId: 'm1', categoryIds: ['c3'],       labelIds: ['l1', 'l2'], paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: 'b12', name: 'Condomínio',          amount: 420,   estimate: null,  variable: false, date:'2026-05-30', recurring: 'monthly',    endsAt: null, assigneeId: 'm2', categoryIds: ['c1'],       labelIds: ['l1'],       paidAt: null,         paidAmount: null,  accountId: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  ],

  silos: [
    { id: 'as1', name: 'Apartamento',           value: 642000, note: 'Estimativa de mercado',   goalAmount: null,  labelIds: [],       updatedAt: '2026-03-12', createdAt: '2025-01-01' },
    { id: 'as2', name: 'Reserva de emergência', value: 18400,  note: 'CDB Itaú',                goalAmount: 30000, labelIds: ['l4'],   updatedAt: '2026-05-09', createdAt: '2025-01-01' },
    { id: 'as3', name: 'Ações Tesla',           value: 9120,   note: '38 cotas',                goalAmount: null,  labelIds: [],       updatedAt: '2026-04-28', createdAt: '2025-01-01' },
    { id: 'as4', name: 'Honda Civic',           value: 11500,  note: '2019, 47 mil km',         goalAmount: null,  labelIds: [],       updatedAt: '2026-02-04', createdAt: '2025-01-01' },
    { id: 'as5', name: 'Faculdade da Sofia',    value: 14200,  note: 'Plano educacional',       goalAmount: 50000, labelIds: ['l4'],   updatedAt: '2026-05-01', createdAt: '2025-01-01' },
  ],

  incomes: [
    { id: 'i1', memberId: 'm1', name: 'Salário — Atlas Logística',   amount: 6800, schedule: { kind: 'monthly', days: [1]     }, createdAt: '2026-01-01' },
    { id: 'i2', memberId: 'm1', name: 'Freela',                       amount: 800,  schedule: { kind: 'monthly', days: [20]    }, createdAt: '2026-01-01' },
    { id: 'i3', memberId: 'm2', name: 'Salário — Hospital São Lucas', amount: 5200, schedule: { kind: 'split',   days: [1, 15] }, createdAt: '2026-01-01' },
  ],

  // Transactions drive cashOnHand (derived, not stored).
  // Running total:
  //   income  +6800 +2600 +2600 +800 +1820     = +14620
  //   expense(recurring) -2850 -89 -24 -184      =  -3147
  //   expense  -142.40 -68.50 -84               =  -294.90
  //   transfer-in (to silo) -1000               =  -1000
  // cashOnHand ≈ 10178  →  freeToSpend ≈ 9143 (pending ≈ 1035)
  transactions: [
    { id: 't7',  kind: 'income',       name: 'Salário — Atlas Logística',    amount: 6800,   date: '2026-05-01', byMemberId: 'm1', accountId: 'a1', siloId: null,  expenseId: null,  categoryIds: [], receivedAt: '2026-05-01', createdAt: '2026-05-01' },
    { id: 't8',  kind: 'income',       name: 'Salário — Hospital São Lucas', amount: 2600,   date: '2026-05-01', byMemberId: 'm2', accountId: 'a2', siloId: null,  expenseId: null,  categoryIds: [], receivedAt: '2026-05-01', createdAt: '2026-05-01' },
    { id: 'ti1', kind: 'income',       name: 'Freela',                       amount: 800,    date: '2026-05-16', byMemberId: 'm1', accountId: 'a1', siloId: null,  expenseId: null,  categoryIds: [], receivedAt: '2026-05-16', createdAt: '2026-05-16' },
    { id: 'tp1', kind: 'expense',      name: 'Aluguel',                      amount: 2850,   date: '2026-05-01', byMemberId: 'm1', accountId: 'a1', siloId: null,  expenseId: 'b1',  categoryIds: [], receivedAt: null, createdAt: '2026-05-01' },
    { id: 'tp2', kind: 'expense',      name: 'Internet (Vivo)',               amount: 89,     date: '2026-05-04', byMemberId: 'm2', accountId: 'a2', siloId: null,  expenseId: 'b2',  categoryIds: [], receivedAt: null, createdAt: '2026-05-04' },
    { id: 'tp3', kind: 'expense',      name: 'Netflix',                       amount: 24,     date: '2026-05-07', byMemberId: 'm2', accountId: 'a2', siloId: null,  expenseId: 'b3',  categoryIds: [], receivedAt: null, createdAt: '2026-05-07' },
    { id: 'tp4', kind: 'expense',      name: 'Seguro do carro',               amount: 184,    date: '2026-05-10', byMemberId: 'm1', accountId: 'a3', siloId: null,  expenseId: 'b4',  categoryIds: [], receivedAt: null, createdAt: '2026-05-10' },
    { id: 't5',  kind: 'expense',      name: 'Chuteiras da Sofia',            amount: 84,     date: '2026-05-11', byMemberId: 'm2', accountId: 'a2', siloId: null,  expenseId: null,  categoryIds: ['c2'], receivedAt: null, createdAt: '2026-05-11' },
    { id: 't3',  kind: 'expense',      name: 'Jantar — Tan Tan',              amount: 68.50,  date: '2026-05-13', byMemberId: 'm1', accountId: 'a3', siloId: null,  expenseId: null,  categoryIds: [], receivedAt: null, createdAt: '2026-05-13' },
    { id: 't2',  kind: 'transfer-in',  name: 'Para Reserva de emergência',   amount: 1000,   date: '2026-05-09', byMemberId: 'm1', accountId: 'a1', siloId: 'as2', expenseId: null,  categoryIds: [], receivedAt: null, createdAt: '2026-05-09' },
    { id: 't6',  kind: 'income',       name: 'Salário — Hospital São Lucas', amount: 2600,   date: '2026-05-15', byMemberId: 'm2', accountId: 'a2', siloId: null,  expenseId: null,  categoryIds: [], receivedAt: '2026-05-15', createdAt: '2026-05-15' },
    { id: 't1',  kind: 'expense',      name: 'Mercado — Pão de Açúcar',      amount: 142.40, date: '2026-05-15', byMemberId: 'm2', accountId: 'a2', siloId: null,  expenseId: null,  categoryIds: [], receivedAt: null, createdAt: '2026-05-15' },
    { id: 't9',  kind: 'income',       name: 'Restituição do IR',            amount: 1820,   date: '2026-04-22', byMemberId: 'm1', accountId: 'a1', siloId: null,  expenseId: null,  categoryIds: [], receivedAt: '2026-04-22', createdAt: '2026-04-22' },
  ],

};
