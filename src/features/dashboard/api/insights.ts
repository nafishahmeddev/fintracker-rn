import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { accounts, payments } from '../../../db/schema';

export type DashboardInsight = {
  id: string;
  type: 'success' | 'danger' | 'info' | 'warning';
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
};

/**
 * getDashboardInsights: Calculates high-level financial insights using SQLite date functions.
 * 
 * We use 7-day windows and month-based windows to generate:
 * 1. Weekly Spending Comparison (Trend)
 * 2. Net Savings Status (Current Month)
 * 3. Daily Burn Rate Trend
 */
export const getDashboardInsights = async (currency: string): Promise<DashboardInsight[]> => {
  const insights: DashboardInsight[] = [];
  
  // Helper for Date windows in SQLite
  const getPeriodSum = async (daysBackStart: number, daysBackEnd: number, type: 'CR' | 'DR') => {
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
          sql`date(${payments.datetime}) >= date('now', ${`-${daysBackStart} days`})`,
          sql`date(${payments.datetime}) < date('now', ${`-${daysBackEnd} days`})`
        )
      );
    return result?.total ?? 0;
  };

  try {
    // 1. Weekly Spending Insight (This 7 days vs Previous 7 days)
    const thisWeekExpense = await getPeriodSum(7, 0, 'DR');
    const lastWeekExpense = await getPeriodSum(14, 7, 'DR');

    if (thisWeekExpense > 0 || lastWeekExpense > 0) {
      const diff = thisWeekExpense - lastWeekExpense;
      const percent = lastWeekExpense > 0 ? (Math.abs(diff) / lastWeekExpense) * 100 : 100;
      const isIncrease = diff > 0;

      insights.push({
        id: 'weekly-spend',
        type: isIncrease ? 'danger' : 'success',
        title: 'Weekly Spending',
        value: `${isIncrease ? '+' : '-'}${percent.toFixed(0)}%`,
        subtitle: isIncrease ? 'Spent more than last week' : 'Saving more than last week',
        icon: isIncrease ? 'trending-up-outline' : 'trending-down-outline',
        trend: isIncrease ? 'up' : 'down',
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
          sql`strftime('%m', ${payments.datetime}) = strftime('%m', 'now')`,
          sql`strftime('%Y', ${payments.datetime}) = strftime('%Y', 'now')`
        )
      );

    const netSavings = (monthlyStats?.income ?? 0) - (monthlyStats?.expense ?? 0);
    if (netSavings !== 0) {
      insights.push({
        id: 'monthly-net',
        type: netSavings > 0 ? 'success' : 'warning',
        title: 'Month Net',
        value: `${currency}${Math.abs(netSavings).toLocaleString()}`,
        subtitle: netSavings > 0 ? 'Positive net position' : 'Spent more than earned',
        icon: netSavings > 0 ? 'wallet-outline' : 'alert-circle-outline',
      });
    }

    // 3. Category Spike (Anomaly)
    // Find if any category has spiked vs its average (Simplified logic for now)
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
          eq(payments.type, 'DR'),
          sql`date(${payments.datetime}) >= date('now', '-30 days')`
        )
      )
      .groupBy(payments.categoryId)
      .orderBy(sql`SUM(${payments.amount}) DESC`)
      .limit(1);

    if (topCategory && topCategory[0]) {
      insights.push({
        id: 'top-burn',
        type: 'info',
        title: 'Burn Sector',
        value: topCategory[0].name,
        subtitle: `Highest expense last 30 days`,
        icon: 'flame-outline',
      });
    }

  } catch (error) {
    console.error('[Insights API] Failed to compute insights:', error);
  }

  return insights;
};
