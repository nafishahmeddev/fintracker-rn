import { desc, eq, like, or } from 'drizzle-orm';
import { db } from '@/src/db/client';
import { accounts, categories, payments } from '@/src/db/schema';
import type { Account } from '@/src/features/accounts/api/accounts';
import type { Category } from '@/src/features/categories/api/categories';
import type { TransactionListItem } from '@/src/features/transactions/api/transactions';

const TRANSACTION_SELECT = {
  id: payments.id,
  accountId: payments.accountId,
  categoryId: payments.categoryId,
  amount: payments.amount,
  type: payments.type,
  datetime: payments.datetime,
  note: payments.note,
  account: {
    id: accounts.id,
    name: accounts.name,
    currency: accounts.currency,
    color: accounts.color,
  },
  category: {
    id: categories.id,
    name: categories.name,
    icon: categories.icon,
    color: categories.color,
  },
  createdAt: payments.createdAt,
  updatedAt: payments.updatedAt,
} as const;

export interface GlobalSearchResults {
  query: string;
  transactions: TransactionListItem[];
  accounts: Account[];
  categories: Category[];
}

const searchTransactions = async (
  query: string,
  limit = 12,
): Promise<TransactionListItem[]> => {
  const q = `%${query}%`;
  return db
    .select(TRANSACTION_SELECT)
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .where(
      or(
        like(payments.note, q),
        like(accounts.name, q),
        like(categories.name, q),
      ),
    )
    .orderBy(desc(payments.datetime))
    .limit(limit);
};

const searchAccounts = async (query: string): Promise<Account[]> => {
  const q = `%${query}%`;
  return db
    .select()
    .from(accounts)
    .where(like(accounts.name, q))
    .limit(5);
};

const searchCategories = async (query: string): Promise<Category[]> => {
  const q = `%${query}%`;
  return db
    .select()
    .from(categories)
    .where(like(categories.name, q))
    .limit(10);
};

export const globalSearch = async (query: string): Promise<GlobalSearchResults> => {
  const trimmed = query.trim();
  const [txResults, acctResults, catResults] = await Promise.all([
    searchTransactions(trimmed),
    searchAccounts(trimmed),
    searchCategories(trimmed),
  ]);
  return { query: trimmed, transactions: txResults, accounts: acctResults, categories: catResults };
};
