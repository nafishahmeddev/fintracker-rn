import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';
import { getDaysAgoLocal, getLocalISOString, getStartOfMonthLocal } from '../../../utils/date';
import { TransactionType } from '../../../types';

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
 * calculatePercentageChange: Internal helper for safe percentage calculation.
 */
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * getWeeklyReport: Aggregate financial data for the last 7 days vs previous 7 days.
 */
export async function getWeeklyReport(currency: string): Promise<ReportData> {
  const getTotals = async (daysBackStart: number, daysBackEnd: number) => {
    const startStr = getDaysAgoLocal(daysBackStart);
    const endStr = getDaysAgoLocal(daysBackEnd);

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
          sql`date(${payments.datetime}) >= ${startStr}`,
          sql`date(${payments.datetime}) < ${endStr}`
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
        eq(payments.type, 'DR' as TransactionType),
        sql`date(${payments.datetime}) >= ${getDaysAgoLocal(7)}`
      )
    )
    .groupBy(categories.id)
    .orderBy(sql`SUM(${payments.amount}) DESC`)
    .limit(5);

  const totalExpense = current.expense || 1;
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
    startDate: getDaysAgoLocal(7),
    endDate: getLocalISOString(),
    comparison: {
      incomeChange: calculatePercentageChange(current.income, previous.income),
      expenseChange: calculatePercentageChange(current.expense, previous.expense),
    }
  };
}

/**
 * getMonthlyReport: Aggregate financial data for the current calendar month.
 */
export async function getMonthlyReport(currency: string): Promise<ReportData> {
  const startOfMonth = getStartOfMonthLocal();

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
        sql`date(${payments.datetime}) >= ${startOfMonth}`
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
        eq(payments.type, 'DR' as TransactionType),
        sql`date(${payments.datetime}) >= ${startOfMonth}`
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
    startDate: startOfMonth,
    endDate: getLocalISOString(),
  };
}
