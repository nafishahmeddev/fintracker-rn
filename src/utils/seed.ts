import { db } from '../db/client';
import { accounts, categories, payments } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Multipliers relative to USD to provide realistic amounts for different currencies.
 */
const CURRENCY_MULTIPLIERS: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83,
  JPY: 151,
  KRW: 1340,
  IDR: 15800,
  VND: 24700,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.52,
  BRL: 5.0,
  MXN: 16.7,
  TRY: 32.2,
};

/**
 * Seeds the database with random transactions for the past 12 months.
 * This is intended for development and testing purposes only.
 */
export async function seedDummyData() {
  try {
    // 1. Get the first account
    const allAccounts = await db.select().from(accounts).limit(1);
    if (allAccounts.length === 0) {
      throw new Error('No accounts found. Please complete onboarding first.');
    }
    const account = allAccounts[0];
    const multiplier = CURRENCY_MULTIPLIERS[account.currency.toUpperCase()] ?? 1;

    // 2. Get categories
    const allCategories = await db.select().from(categories);
    const incomeCats = allCategories.filter(c => c.type === 'CR');
    const expenseCats = allCategories.filter(c => c.type === 'DR');

    if (incomeCats.length === 0 || expenseCats.length === 0) {
      throw new Error('Missing categories. Please ensure seed categories are present.');
    }

    const now = new Date();
    const transactions = [];
    let totalIncome = 0;
    let totalExpense = 0;

    // 3. Generate data for 12 months
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      
      // A. Monthly Salary (Income) - Base $5000scaled by multiplier
      const salaryAmount = (5000 + Math.floor(Math.random() * 2000)) * multiplier;
      const salaryDate = new Date(monthDate);
      salaryDate.setDate(1 + Math.floor(Math.random() * 5)); // 1st - 5th
      
      transactions.push({
        accountId: account.id,
        categoryId: incomeCats[Math.floor(Math.random() * incomeCats.length)].id,
        amount: salaryAmount,
        type: 'CR' as const,
        datetime: salaryDate.toISOString(),
        note: 'Monthly Salary Credit',
      });
      totalIncome += salaryAmount;

      // B. Monthly Rent (Expense) - Base $1200 scaled
      const rentAmount = (1200 + Math.floor(Math.random() * 300)) * multiplier;
      const rentDate = new Date(monthDate);
      rentDate.setDate(1); // 1st of each month
      
      transactions.push({
        accountId: account.id,
        categoryId: expenseCats.find(c => c.name.toLowerCase().includes('rent'))?.id || expenseCats[0].id,
        amount: rentAmount,
        type: 'DR' as const,
        datetime: rentDate.toISOString(),
        note: 'Monthly Rent Payment',
      });
      totalExpense += rentAmount;

      // C. 5-8 Random Expenses per month - Base $10-$210 scaled
      const expenseCount = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < expenseCount; i++) {
        const amount = (10 + Math.floor(Math.random() * 200)) * multiplier;
        const date = new Date(monthDate);
        date.setDate(1 + Math.floor(Math.random() * 28));
        
        const cat = expenseCats[Math.floor(Math.random() * expenseCats.length)];
        
        transactions.push({
          accountId: account.id,
          categoryId: cat.id,
          amount: amount,
          type: 'DR' as const,
          datetime: date.toISOString(),
          note: `Purchase at ${cat.name}`,
        });
        totalExpense += amount;
      }
    }

    // 4. Batch insert payments
    await db.insert(payments).values(transactions);

    // 5. Update account totals
    // Note: We add to existing balance/income/expense
    await db.update(accounts)
      .set({
        balance: sql`${accounts.balance} + ${totalIncome} - ${totalExpense}`,
        income: sql`${accounts.income} + ${totalIncome}`,
        expense: sql`${accounts.expense} + ${totalExpense}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(accounts.id, account.id));

    return transactions.length;
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}
