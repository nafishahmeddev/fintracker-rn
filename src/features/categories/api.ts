import { db } from '../../db/client';
import { categories } from '../../db/schema';
import { eq } from 'drizzle-orm';

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const getCategories = async (): Promise<Category[]> => {
  return await db.select().from(categories);
};

export const createCategory = async (data: InsertCategory) => {
  const result = await db.insert(categories).values(data).returning();
  return result[0];
};

export const updateCategory = async (id: number, data: Partial<InsertCategory>) => {
  const result = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
  return result[0];
};

export const deleteCategory = async (id: number) => {
  return await db.delete(categories).where(eq(categories.id, id));
};
