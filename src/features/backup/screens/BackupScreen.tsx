import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { RADIUS, SPACING } from '@/src/theme/tokens';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { File } from 'expo-file-system';
import { BackupService } from '../api/backup.service';

export function BackupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportedData, setExportedData] = useState<{ content: string; filename: string } | null>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  const [backupSummary, setBackupSummary] = useState<{
    version: string;
    exportedAt: string;
    accountsCount: number;
    categoriesCount: number;
    transactionsCount: number;
    hasProfile: boolean;
  } | null>(null);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);
      const result = await BackupService.createBackup();
      setExportedData(result);
      setShowExportOptions(true);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to create backup'
      );
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleSaveToFolder = useCallback(async () => {
    if (!exportedData) return;
    
    setShowExportOptions(false);
    
    try {
      await BackupService.saveToFolder(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save backup'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const handleShare = useCallback(async () => {
    if (!exportedData) return;
    
    setShowExportOptions(false);
    
    try {
      await BackupService.shareFile(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Share Failed',
        error instanceof Error ? error.message : 'Failed to share backup'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const handleImport = useCallback(async () => {
    try {
      setIsImporting(true);
      const file = await BackupService.pickBackupFile();
      
      if (!file) {
        setIsImporting(false);
        return;
      }

      const summary = await BackupService.getBackupSummary(file);
      setBackupSummary(summary);
      setSelectedBackupFile(file);
      setShowRestoreDialog(true);
    } catch (error) {
      Alert.alert(
        'Invalid Backup',
        error instanceof Error ? error.message : 'Failed to read backup file'
      );
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleConfirmRestore = useCallback(async () => {
    if (!selectedBackupFile) return;

    try {
      setIsImporting(true);
      setShowRestoreDialog(false);
      
      const data = await BackupService.readBackupFile(selectedBackupFile);
      await BackupService.restoreBackup(data);
      
      Alert.alert(
        'Restore Complete',
        'Your data has been restored successfully. The app will now reload.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(main)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        error instanceof Error ? error.message : 'Failed to restore backup'
      );
    } finally {
      setIsImporting(false);
      setSelectedBackupFile(null);
      setBackupSummary(null);
    }
  }, [selectedBackupFile, router]);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header title="Backup & Restore" subtitle="Data management" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumGuard label="Data Backup">
          <View style={styles.heroCard}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Protect Your Data</Text>
            <Text style={styles.heroSubtitle}>
              Create backups of your financial data. Save to device storage or share to cloud storage for safekeeping.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BACKUP OPTIONS</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleExport}
                disabled={isExporting || isImporting}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                  {isExporting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  )}
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Export Data</Text>
                  <Text style={styles.actionSubtitle}>Create a backup file</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleImport}
                disabled={isExporting || isImporting}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.success + '15' }]}>
                  {isImporting ? (
                    <ActivityIndicator size="small" color={colors.success} />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={20} color={colors.success} />
                  )}
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Restore Data</Text>
                  <Text style={styles.actionSubtitle}>Import from a backup file</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INFORMATION</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="document-text-outline" size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>Format: JSON (human-readable)</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="folder-open-outline" size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>
                  {Platform.OS === 'ios' 
                    ? 'Save to Files app or Share to other apps' 
                    : 'Save to any folder or Share to apps'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
                <Text style={styles.infoText}>Not encrypted - keep files secure</Text>
              </View>
            </View>
          </View>

          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={20} color={colors.danger} />
            <Text style={styles.warningText}>
              Restoring will replace all existing data. This action cannot be undone.
            </Text>
          </View>
        </PremiumGuard>
      </ScrollView>

      <OptionsDialog
        visible={showExportOptions}
        onClose={() => {
          setShowExportOptions(false);
          setExportedData(null);
        }}
        title="Export Complete"
        subtitle={exportedData ? `File: ${exportedData.filename}` : 'Choose how to save your backup'}
        options={[
          {
            key: 'save',
            label: Platform.OS === 'ios' ? 'Save to Files' : 'Save to Folder',
            icon: 'folder-outline',
            selected: false,
            onPress: handleSaveToFolder,
          },
          {
            key: 'share',
            label: 'Share to Apps',
            icon: 'share-outline',
            selected: false,
            onPress: handleShare,
          },
        ]}
      />

      <ConfirmDialog
        visible={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false);
          setSelectedBackupFile(null);
          setBackupSummary(null);
        }}
        title="Confirm Restore"
        confirmLabel="Restore"
        destructive
        message={
          backupSummary
            ? `This backup contains:\n\n` +
              `• ${backupSummary.accountsCount} account${backupSummary.accountsCount !== 1 ? 's' : ''}\n` +
              `• ${backupSummary.categoriesCount} categor${backupSummary.categoriesCount !== 1 ? 'ies' : 'y'}\n` +
              `• ${backupSummary.transactionsCount} transaction${backupSummary.transactionsCount !== 1 ? 's' : ''}\n` +
              `• ${backupSummary.hasProfile ? 'Settings & profile' : 'No settings'}\n\n` +
              `Exported: ${formatDate(backupSummary.exportedAt)}\n\n` +
              `Your current data will be replaced.`
            : 'Are you sure you want to restore this backup?'
        }
        onConfirm={handleConfirmRestore}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['3'],
      paddingBottom: SPACING['9'],
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING['6'],
      alignItems: 'center',
      marginBottom: SPACING['7'],
    },
    heroIconContainer: {
      width: 64,
      height: 64,
      borderRadius: RADIUS['2xl'],
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING['4'],
    },
    heroTitle: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 20,
      color: colors.text,
      marginBottom: SPACING['2'],
    },
    heroSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    section: {
      marginBottom: SPACING['6'],
    },
    sectionLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 2,
      marginBottom: SPACING['3'],
      paddingLeft: SPACING['1'],
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING['4'],
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING['3.5'],
    },
    actionTextContainer: {
      flex: 1,
    },
    actionTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 16,
      color: colors.text,
      marginBottom: SPACING['0.5'],
    },
    actionSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 74,
    },
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: SPACING['4'],
      gap: SPACING['3'],
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
    },
    infoText: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: SPACING['3'],
      backgroundColor: colors.danger + '10',
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.danger + '25',
      padding: SPACING['4'],
      marginTop: SPACING['2'],
    },
    warningText: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      color: colors.danger,
      lineHeight: 18,
    },
  });
