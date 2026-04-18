import { desc, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { payments } from '../../../db/schema';
import { getDaysAgoLocal, getLocalISOString } from '../../../utils/date';

/**
 * getCurrentStreak: Calculates the current usage streak based on days with transactions.
 * 
 * Primitive-first logic:
 * 1. Fetch unique transaction dates (YYYY-MM-DD) for the last 90 days.
 * 2. Verify if 'today' or 'yesterday' is the starting point in local time.
 * 3. Count consecutive days backwards.
 */
export async function getCurrentStreak(): Promise<number> {
  const ninetyDaysAgo = getDaysAgoLocal(90);

  // Get unique local dates where payments occurred
  const allDates = await db
    .select({
      date: sql<string>`date(${payments.datetime})`
    })
    .from(payments)
    .where(sql`date(${payments.datetime}) >= ${ninetyDaysAgo}`)
    .groupBy(sql`date(${payments.datetime})`)
    .orderBy(desc(sql`date(${payments.datetime})`));

  if (allDates.length === 0) return 0;

  const dates = allDates.map(d => d.date);

  const today = getLocalISOString();
  const yesterday = getDaysAgoLocal(1);

  // If the latest date is neither today nor yesterday, the streak is broken
  const latestDate = dates[0];
  if (latestDate !== today && latestDate !== yesterday) {
    return 0;
  }

  let streak = 0;
  // We use a date object for backtracking correctly across month/year boundaries
  let currentDate = new Date(latestDate);

  for (const dateStr of dates) {
    const expectedStr = getLocalISOString(currentDate);

    if (dateStr === expectedStr) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
