import type { Bill, Household, ID, Transaction } from './entities';

export interface HouseholdRepo {
  load(): Promise<Household>;
  save(h: Household): Promise<void>;
  addTransaction(t: Transaction): Promise<void>;
  addBill(b: Bill): Promise<void>;
  updateBill(id: ID, patch: Partial<Bill>): Promise<void>;
  deleteBill(id: ID): Promise<void>;
  updateHousehold(patch: Partial<Household>): Promise<void>;
}
