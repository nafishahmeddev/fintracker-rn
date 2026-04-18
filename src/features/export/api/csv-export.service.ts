import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { Platform, Alert } from 'react-native';

export interface ExportDateRange {
  startDate: Date;
  endDate: Date;
}

export interface CsvExportOptions {
  dateRange?: ExportDateRange;
  accountId?: number;
  categoryId?: number;
  type?: 'CR' | 'DR';
}

interface TransactionExportRow {
  id: number;
  date: string;
  time: string;
  type: 'Income' | 'Expense';
  amount: string;
  currency: string;
  account: string;
  category: string;
  note: string;
  accountHolder: string;
}

export class CsvExportService {
  private static readonly CSV_HEADER = [
    'Date',
    'Time',
    'Type',
    'Amount',
    'Currency',
    'Account',
    'Account Holder',
    'Category',
    'Note',
  ].join(',');

  private static escapeCsvField(field: string): string {
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (/[",\n\r]/.test(field)) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private static formatRow(row: TransactionExportRow): string {
    const fields = [
      row.date,
      row.time,
      row.type,
      row.amount,
      row.currency,
      row.account,
      row.accountHolder,
      row.category,
      row.note,
    ].map(field => this.escapeCsvField(field));
    return fields.join(',');
  }

  static async getTransactionCount(options: CsvExportOptions = {}): Promise<number> {
    const conditions = this.buildConditions(options);

    const result = await db
      .select({ total: count() })
      .from(payments)
      .where(conditions);

    return Number(result[0]?.total ?? 0);
  }

  private static buildConditions(options: CsvExportOptions) {
    const conditions = [];

    if (options.dateRange) {
      const startIso = options.dateRange.startDate.toISOString().split('T')[0];
      const endIso = options.dateRange.endDate.toISOString().split('T')[0];
      conditions.push(gte(payments.datetime, startIso));
      conditions.push(lte(payments.datetime, endIso));
    }

    if (options.accountId !== undefined) {
      conditions.push(eq(payments.accountId, options.accountId));
    }

    if (options.categoryId !== undefined) {
      conditions.push(eq(payments.categoryId, options.categoryId));
    }

    if (options.type !== undefined) {
      conditions.push(eq(payments.type, options.type));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  static async exportToCsv(options: CsvExportOptions = {}): Promise<{ content: string; filename: string }> {
    const conditions = this.buildConditions(options);

    // Fetch all matching transactions
    const rows = await db
      .select({
        id: payments.id,
        datetime: payments.datetime,
        type: payments.type,
        amount: payments.amount,
        note: payments.note,
        account: {
          name: accounts.name,
          currency: accounts.currency,
          holderName: accounts.holderName,
        },
        category: {
          name: categories.name,
        },
      })
      .from(payments)
      .innerJoin(accounts, eq(payments.accountId, accounts.id))
      .innerJoin(categories, eq(payments.categoryId, categories.id))
      .where(conditions)
      .orderBy(desc(payments.datetime));

    // Format for CSV
    const exportRows: TransactionExportRow[] = rows.map(row => {
      const dateObj = new Date(row.datetime);
      const date = dateObj.toISOString().split('T')[0];
      const time = dateObj.toTimeString().split(' ')[0].slice(0, 5);

      return {
        id: row.id,
        date,
        time,
        type: row.type === 'CR' ? 'Income' : 'Expense',
        amount: row.amount.toFixed(2),
        currency: row.account.currency,
        account: row.account.name,
        accountHolder: row.account.holderName,
        category: row.category.name,
        note: row.note || '',
      };
    });

    // Generate CSV content
    const lines: string[] = [this.CSV_HEADER];
    for (const row of exportRows) {
      lines.push(this.formatRow(row));
    }

    const csvContent = lines.join('\n');

    // Create filename with date range info
    let filename: string;
    if (options.dateRange) {
      const start = options.dateRange.startDate.toISOString().split('T')[0];
      const end = options.dateRange.endDate.toISOString().split('T')[0];
      filename = `luno_transactions_${start}_to_${end}.csv`;
    } else {
      const today = new Date().toISOString().split('T')[0];
      filename = `luno_transactions_all_${today}.csv`;
    }

    return { content: csvContent, filename };
  }

  /**
   * Save CSV to a specific folder using platform's native picker
   * Android: Opens SAF folder picker
   * iOS: Opens share sheet with "Save to Files" option
   */
  static async saveToFolder(content: string, filename: string): Promise<void> {
    if (Platform.OS === 'android') {
      await this.saveAndroid(content, filename);
    } else {
      await this.saveIOS(content, filename);
    }
  }

  /**
   * Share CSV to other apps
   * Opens native share sheet on both platforms
   */
  static async shareFile(content: string, filename: string): Promise<void> {
    // Write to temp file
    const tempFile = new File(Paths.cache, filename);
    await tempFile.write(content);

    if (!tempFile.exists) {
      throw new Error('Failed to create file');
    }

    // Share the file
    await Sharing.shareAsync(tempFile.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Share CSV Export',
    });
  }

  private static async saveAndroid(content: string, filename: string): Promise<void> {
    try {
      // Request directory permissions - opens native folder picker
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (!permissions.granted) {
        Alert.alert('Permission Denied', 'Cannot save without folder access.');
        return;
      }

      // Create the file in the chosen directory
      const fileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        filename,
        'text/csv'
      );

      // Write content
      await StorageAccessFramework.writeAsStringAsync(fileUri, content, {
        encoding: 'utf8',
      });

      Alert.alert('Saved', `CSV saved as ${filename}`);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Failed to save CSV');
    }
  }

  private static async saveIOS(content: string, filename: string): Promise<void> {
    // Write to temp file first
    const tempFile = new File(Paths.cache, filename);
    await tempFile.write(content);

    if (!tempFile.exists) {
      throw new Error('Failed to create export file');
    }

    // Share the file (iOS shows "Save to Files" natively)
    await Sharing.shareAsync(tempFile.uri, {
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
      dialogTitle: 'Save CSV Export',
    });
  }

  static getDateRangePresets(): { label: string; getRange: () => ExportDateRange }[] {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return [
      {
        label: 'This Month',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          return { startDate: start, endDate: today };
        },
      },
      {
        label: 'Last Month',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const end = new Date(today.getFullYear(), today.getMonth(), 0);
          end.setHours(23, 59, 59, 999);
          return { startDate: start, endDate: end };
        },
      },
      {
        label: 'Last 3 Months',
        getRange: () => {
          const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
          return { startDate: start, endDate: today };
        },
      },
      {
        label: 'This Year',
        getRange: () => {
          const start = new Date(today.getFullYear(), 0, 1);
          return { startDate: start, endDate: today };
        },
      },
      {
        label: 'Last Year',
        getRange: () => {
          const start = new Date(today.getFullYear() - 1, 0, 1);
          const end = new Date(today.getFullYear() - 1, 11, 31);
          end.setHours(23, 59, 59, 999);
          return { startDate: start, endDate: end };
        },
      },
      {
        label: 'All Time',
        getRange: () => {
          // Go back 10 years as a reasonable "all time" default
          const start = new Date(today.getFullYear() - 10, 0, 1);
          return { startDate: start, endDate: today };
        },
      },
    ];
  }
}
