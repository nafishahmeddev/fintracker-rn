import { desc, sql } from 'drizzle-orm';
import { db } from '../../../db/client';
import { payments } from '../../../db/schema';

/**
 * getCurrentStreak: Calculates the current usage streak based on days with transactions.
 * 
 * Logic:
 * 1. Fetch unique transaction dates (YYYY-MM-DD).
 * 2. Check if a transaction exists for 'today'. If not, check 'yesterday'.
 * 3. Iterate backwards and count consecutive days.
 */
export async function getCurrentStreak(): Promise<number> {
  // Get unique dates where payments occurred
  const allDates = await db
    .select({
      date: sql<string>`date(${payments.datetime})`
    })
    .from(payments)
    .groupBy(sql`date(${payments.datetime})`)
    .orderBy(desc(sql`date(${payments.datetime})`));

  if (allDates.length === 0) return 0;

  const dates = allDates.map(d => d.date);
  
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  // If the latest date is neither today nor yesterday, the streak is broken
  const latestDate = dates[0];
  if (latestDate !== today && latestDate !== yesterday) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(latestDate);

  // We check each date in our sorted list
  for (const dateStr of dates) {
    const expectedStr = currentDate.toISOString().split('T')[0];
    
    if (dateStr === expectedStr) {
      streak++;
      // Move current date one day back for the next iteration
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // Streak broken
      break;
    }
  }

  return streak;
}
