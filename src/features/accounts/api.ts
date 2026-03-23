import { db } from '../../db/client';
import { accounts } from '../../db/schema';
import { eq } from 'drizzle-orm';

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

export const getAccounts = async (): Promise<Account[]> => {
  return await db.select().from(accounts);
};

export const createAccount = async (data: InsertAccount) => {
  const result = await db.insert(accounts).values(data).returning();
  return result[0];
};

export const updateAccount = async (id: number, data: Partial<InsertAccount>) => {
  const result = await db.update(accounts).set(data).where(eq(accounts.id, id)).returning();
  return result[0];
};

export const deleteAccount = async (id: number) => {
  return await db.delete(accounts).where(eq(accounts.id, id));
};
