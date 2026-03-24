import { db } from '../../../db/client';
import { payments, accounts, categories } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const getTransactions = async () => {
  const result = await db
    .select({
      payment: payments,
      account: accounts,
      category: categories,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .orderBy(desc(payments.datetime));

  return result.map((row) => ({
    ...row.payment,
    account: row.account,
    category: row.category,
  }));
};

export const createTransaction = async (data: InsertPayment) => {
  // To keep it simple, we use a transaction conceptually but SQLite does basic insert.
  // We should also update account balances based on payment type, but we will start with insertion.
  const result = await db.insert(payments).values(data).returning();
  return result[0];
};

export const deleteTransaction = async (id: number) => {
  return await db.delete(payments).where(eq(payments.id, id));
};
