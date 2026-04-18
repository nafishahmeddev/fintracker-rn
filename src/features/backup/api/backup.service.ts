import { db } from '../../../db/client';
import { accounts, categories, payments } from '../../../db/schema';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import { Platform, Alert } from 'react-native';

export interface BackupData {
  version: string;
  exportedAt: string;
  accounts: typeof accounts.$inferSelect[];
  categories: typeof categories.$inferSelect[];
  payments: typeof payments.$inferSelect[];
  profile?: {
    name?: string;
    theme?: 'light' | 'dark' | 'system';
    reminderEnabled?: boolean;
    reminderTime?: string;
  };
}

const BACKUP_VERSION = '1.0';
const BACKUP_FILE_PREFIX = 'luno_backup_';

export class BackupService {
  static async createBackup(): Promise<{ content: string; filename: string }> {
    // Fetch all data
    const accountsData = await db.select().from(accounts);
    const categoriesData = await db.select().from(categories);
    const paymentsData = await db.select().from(payments);

    // Fetch profile from AsyncStorage
    const profileRaw = await AsyncStorage.getItem('settings_profile');
    const profile = profileRaw ? JSON.parse(profileRaw) : undefined;

    const backupData: BackupData = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      accounts: accountsData,
      categories: categoriesData,
      payments: paymentsData,
      profile: profile ? {
        name: profile.name,
        theme: profile.theme,
        reminderEnabled: profile.reminderEnabled,
        reminderTime: profile.reminderTime,
      } : undefined,
    };

    const content = JSON.stringify(backupData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${BACKUP_FILE_PREFIX}${timestamp}.json`;

    return { content, filename };
  }

  /**
   * Save file to a specific folder using platform's native picker
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
   * Share file to other apps
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
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Share Luno Backup',
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
        'application/json'
      );

      // Write content
      await StorageAccessFramework.writeAsStringAsync(fileUri, content, {
        encoding: 'utf8',
      });

      Alert.alert('Saved', `Backup saved as ${filename}`);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', error instanceof Error ? error.message : 'Failed to save backup');
    }
  }

  private static async saveIOS(content: string, filename: string): Promise<void> {
    // Write to temp file first
    const tempFile = new File(Paths.cache, filename);
    await tempFile.write(content);

    if (!tempFile.exists) {
      throw new Error('Failed to create backup file');
    }

    // Share the file (iOS shows "Save to Files" natively)
    await Sharing.shareAsync(tempFile.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Save Luno Backup',
    });
  }

  static async pickBackupFile(): Promise<File | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return new File(result.assets[0].uri);
  }

  static async readBackupFile(file: File): Promise<BackupData> {
    const content = await file.text();
    const data = JSON.parse(content) as BackupData;

    // Validate backup structure
    if (!data.version || !data.accounts || !data.categories || !data.payments) {
      throw new Error('Invalid backup file format');
    }

    return data;
  }

  static async restoreBackup(data: BackupData): Promise<void> {
    await db.transaction(async (tx) => {
      // Clear existing data
      await tx.delete(payments);
      await tx.delete(categories);
      await tx.delete(accounts);

      // Restore accounts (without auto-increment IDs to avoid conflicts)
      if (data.accounts.length > 0) {
        // Insert with explicit IDs
        for (const account of data.accounts) {
          await tx.insert(accounts).values({
            id: account.id,
            name: account.name,
            holderName: account.holderName,
            accountNumber: account.accountNumber,
            icon: account.icon,
            color: account.color,
            isDefault: account.isDefault,
            currency: account.currency,
            balance: account.balance,
            income: account.income,
            expense: account.expense,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
          });
        }
      }

      // Restore categories
      if (data.categories.length > 0) {
        for (const category of data.categories) {
          await tx.insert(categories).values({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
          });
        }
      }

      // Restore payments
      if (data.payments.length > 0) {
        for (const payment of data.payments) {
          await tx.insert(payments).values({
            id: payment.id,
            accountId: payment.accountId,
            categoryId: payment.categoryId,
            amount: payment.amount,
            type: payment.type,
            datetime: payment.datetime,
            note: payment.note,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
          });
        }
      }
    });

    // Restore profile if present
    if (data.profile) {
      const existingProfileRaw = await AsyncStorage.getItem('settings_profile');
      const existingProfile = existingProfileRaw ? JSON.parse(existingProfileRaw) : {};
      
      await AsyncStorage.setItem('settings_profile', JSON.stringify({
        ...existingProfile,
        ...data.profile,
      }));
    }
  }

  static async getBackupSummary(file: File): Promise<{
    version: string;
    exportedAt: string;
    accountsCount: number;
    categoriesCount: number;
    transactionsCount: number;
    hasProfile: boolean;
  }> {
    const data = await this.readBackupFile(file);
    
    return {
      version: data.version,
      exportedAt: data.exportedAt,
      accountsCount: data.accounts.length,
      categoriesCount: data.categories.length,
      transactionsCount: data.payments.length,
      hasProfile: !!data.profile,
    };
  }
}
