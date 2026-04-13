import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, payments } from '../../../db/schema';
import { getDaysAgoLocal, getStartOfMonthLocal } from '../../../utils/date';
import { InsightStatus, InsightTrend, TransactionType } from '../../../types';

type InsightBase = {
  id: string;
  type: InsightStatus;
  title: string;
  subtitle: string;
  icon: string;
  trend?: InsightTrend;
};

export type AmountInsight = InsightBase & {
  valueType: 'amount';
  amount: number;
  currency: string;
};

export type PercentageInsight = InsightBase & {
  valueType: 'percentage';
  percentage: number;
};

export type TextInsight = InsightBase & {
  valueType: 'text';
  text: string;
};

export type DashboardInsight = AmountInsight | PercentageInsight | TextInsight;

/**
 * getDashboardInsights: Calculates high-level financial insights using SQLite date functions.
 */
export const getDashboardInsights = async (currency: string): Promise<DashboardInsight[]> => {
  const insights: DashboardInsight[] = [];
  
  const getPeriodSum = async (daysBackStart: number, daysBackEnd: number, type: TransactionType) => {
    const startStr = getDaysAgoLocal(daysBackStart);
    const endStr = getDaysAgoLocal(daysBackEnd);

    const [result] = await db
      .select({
        total: sql<number>`SUM(${payments.amount})`,
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .where(
        and(
          eq(accounts.currency, currency),
          eq(payments.type, type),
          sql`date(${payments.datetime}) >= ${startStr}`,
          sql`date(${payments.datetime}) < ${endStr}`
        )
      );
    return result?.total ?? 0;
  };

  try {
    // 1. Weekly Spending Insight
    const thisWeekExpense = await getPeriodSum(7, 0, 'DR');
    const lastWeekExpense = await getPeriodSum(14, 7, 'DR');

    if (thisWeekExpense > 0 || lastWeekExpense > 0) {
      const diff = thisWeekExpense - lastWeekExpense;
      const percent = lastWeekExpense > 0 ? (Math.abs(diff) / lastWeekExpense) * 100 : 100;
      const isIncrease = diff > 0;

      insights.push({
        id: 'weekly-spend',
        type: (isIncrease ? 'danger' : 'success') as InsightStatus,
        title: 'Weekly Spending',
        valueType: 'percentage',
        percentage: isIncrease ? percent : -percent,
        subtitle: isIncrease ? 'Spent more than last week' : 'Saving more than last week',
        icon: isIncrease ? 'trending-up-outline' : 'trending-down-outline',
        trend: (isIncrease ? 'up' : 'down') as InsightTrend,
      });
    }

    // 2. Savings Insight (Current Month Net Position)
    const [monthlyStats] = await db
      .select({
        income: sql<number>`SUM(CASE WHEN ${payments.type} = 'CR' THEN ${payments.amount} ELSE 0 END)`,
        expense: sql<number>`SUM(CASE WHEN ${payments.type} = 'DR' THEN ${payments.amount} ELSE 0 END)`,
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .where(
        and(
          eq(accounts.currency, currency),
          sql`date(${payments.datetime}) >= ${getStartOfMonthLocal()}`
        )
      );

    const netSavings = (monthlyStats?.income ?? 0) - (monthlyStats?.expense ?? 0);
    if (netSavings !== 0) {
      insights.push({
        id: 'monthly-net',
        type: (netSavings > 0 ? 'success' : 'warning') as InsightStatus,
        title: 'Month Net',
        valueType: 'amount',
        amount: Math.abs(netSavings),
        currency,
        subtitle: netSavings > 0 ? 'Positive net position' : 'Spent more than earned',
        icon: netSavings > 0 ? 'wallet-outline' : 'alert-circle-outline',
      });
    }

    // 3. Category Spike
    const topCategory = await db
      .select({
        name: sql<string>`(SELECT name FROM categories WHERE id = ${payments.categoryId})`,
        total: sql<number>`SUM(${payments.amount})`,
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .where(
        and(
          eq(accounts.currency, currency),
          eq(payments.type, 'DR' as TransactionType),
          sql`date(${payments.datetime}) >= ${getDaysAgoLocal(30)}`
        )
      )
      .groupBy(payments.categoryId)
      .orderBy(sql`SUM(${payments.amount}) DESC`)
      .limit(1);

    if (topCategory && topCategory[0]) {
      insights.push({
        id: 'top-burn',
        type: 'info' as InsightStatus,
        title: 'Burn Sector',
        valueType: 'text',
        text: topCategory[0].name,
        subtitle: 'Highest expense last 30 days',
        icon: 'flame-outline',
      });
    }

  } catch (error) {
    console.error('[Insights API] Failed to compute insights:', error);
  }

  return insights;
};
