import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';

export interface ReportCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface ReportData {
  totalIncome: number;
  totalExpense: number;
  netPosition: number;
  savingsRate: number;
  topCategories: ReportCategory[];
  periodLabel: string;
  startDate: string;
  endDate: string;
  comparison?: {
    incomeChange: number;
    expenseChange: number;
  };
}

/**
 * getWeeklyReport: Aggregate financial data for the current week (Mon-Sun or last 7 days).
 * Following the Editorial Brutalist style, we provide deep, clear summaries.
 */
export async function getWeeklyReport(currency: string): Promise<ReportData> {
  const getTotals = async (daysBackStart: number, daysBackEnd: number) => {
    const [result] = await db
      .select({
        income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
        expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .where(
        and(
          eq(accounts.currency, currency),
          sql`date(${payments.datetime}) >= date('now', ${`-${daysBackStart} days`})`,
          sql`date(${payments.datetime}) < date('now', ${`-${daysBackEnd} days`})`
        )
      );
    return {
      income: result?.income ?? 0,
      expense: result?.expense ?? 0,
    };
  };

  const current = await getTotals(7, 0);
  const previous = await getTotals(14, 7);

  const topCats = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      amount: sql<number>`SUM(${payments.amount})`,
    })
    .from(payments)
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(
      and(
        eq(accounts.currency, currency),
        eq(payments.type, 'DR'),
        sql`date(${payments.datetime}) >= date('now', '-7 days')`
      )
    )
    .groupBy(categories.id)
    .orderBy(sql`SUM(${payments.amount}) DESC`)
    .limit(5);

  const totalExpense = current.expense || 1; // avoid div by zero
  const categoriesWithPercent: ReportCategory[] = topCats.map(cat => ({
    ...cat,
    color: `#${cat.color.toString(16).padStart(6, '0')}`,
    percentage: (cat.amount / totalExpense) * 100,
  }));

  const netPosition = current.income - current.expense;
  const savingsRate = current.income > 0 ? (netPosition / current.income) * 100 : 0;

  return {
    totalIncome: current.income,
    totalExpense: current.expense,
    netPosition,
    savingsRate,
    topCategories: categoriesWithPercent,
    periodLabel: 'LAST 7 DAYS',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
    comparison: {
      incomeChange: previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 100,
      expenseChange: previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense) * 100 : 100,
    }
  };
}

/**
 * getMonthlyReport: Aggregate financial data for the current calendar month.
 */
export async function getMonthlyReport(currency: string): Promise<ReportData> {
  const [current] = await db
    .select({
      income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
      expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
    })
    .from(payments)
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(
      and(
        eq(accounts.currency, currency),
        sql`strftime('%m', ${payments.datetime}) = strftime('%m', 'now')`,
        sql`strftime('%Y', ${payments.datetime}) = strftime('%Y', 'now')`
      )
    );

  const topCats = await db
    .select({
      id: categories.id,
      name: categories.name,
      icon: categories.icon,
      color: categories.color,
      amount: sql<number>`SUM(${payments.amount})`,
    })
    .from(payments)
    .innerJoin(categories, eq(payments.categoryId, categories.id))
    .innerJoin(accounts, eq(payments.accountId, accounts.id))
    .where(
      and(
        eq(accounts.currency, currency),
        eq(payments.type, 'DR'),
        sql`strftime('%m', ${payments.datetime}) = strftime('%m', 'now')`,
        sql`strftime('%Y', ${payments.datetime}) = strftime('%Y', 'now')`
      )
    )
    .groupBy(categories.id)
    .orderBy(sql`SUM(${payments.amount}) DESC`)
    .limit(5);

  const income = current?.income ?? 0;
  const expense = current?.expense ?? 0;
  const totalExpense = expense || 1;
  
  const categoriesWithPercent: ReportCategory[] = topCats.map(cat => ({
    ...cat,
    color: `#${cat.color.toString(16).padStart(6, '0')}`,
    percentage: (cat.amount / totalExpense) * 100,
  }));

  const netPosition = income - expense;
  const savingsRate = income > 0 ? (netPosition / income) * 100 : 0;

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' }).toUpperCase();

  return {
    totalIncome: income,
    totalExpense: expense,
    netPosition,
    savingsRate,
    topCategories: categoriesWithPercent,
    periodLabel: monthName,
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    endDate: now.toISOString(),
  };
}
