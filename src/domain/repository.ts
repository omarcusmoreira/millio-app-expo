import type { Expense, Household, ID, Transaction } from './entities';

export interface HouseholdRepo {
  load(): Promise<Household>;
  save(h: Household): Promise<void>;
  addTransaction(t: Transaction): Promise<void>;
  addExpense(e: Expense): Promise<void>;
  updateExpense(id: ID, patch: Partial<Expense>): Promise<void>;
  deleteExpense(id: ID): Promise<void>;
  updateHousehold(patch: Partial<Household>): Promise<void>;
}
