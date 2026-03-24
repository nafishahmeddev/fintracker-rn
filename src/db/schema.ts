import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  holderName: text('holderName').notNull(),
  accountNumber: text('accountNumber').notNull(),
  icon: text('icon').notNull().default('wallet'),
  color: integer('color').notNull(),
  isDefault: integer('isDefault', { mode: 'boolean' }).notNull().default(false),
  currency: text('currency').notNull().default('USD'),
  balance: real('balance').notNull().default(0),
  income: real('income').notNull().default(0),
  expense: real('expense').notNull().default(0),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('grid'),
  color: integer('color').notNull(),
  type: text('type', { enum: ['CR', 'DR'] }).notNull().default('DR'),
  budget: real('budget').notNull().default(0),
  expense: real('expense').notNull().default(0),
});

export const payments = sqliteTable('payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  type: text('type', { enum: ['CR', 'DR'] }).notNull(),
  datetime: text('datetime').notNull(),
  note: text('note').notNull(),
});
