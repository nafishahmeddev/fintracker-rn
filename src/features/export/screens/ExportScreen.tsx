import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { Header } from '@/src/components/ui/Header';
import { OptionsDialog } from '@/src/components/ui/OptionsDialog';
import { PremiumGuard } from '@/src/components/ui/PremiumGuard';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { CsvExportService, ExportDateRange } from '../api/csv-export.service';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';

export function ExportScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();

  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [customRange, setCustomRange] = useState<ExportDateRange | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<'ALL' | 'CR' | 'DR'>('ALL');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportedData, setExportedData] = useState<{ content: string; filename: string } | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const presets = useMemo(() => CsvExportService.getDateRangePresets(), []);

  const effectiveDateRange = useMemo(() => {
    if (customRange) return customRange;
    return presets[selectedPreset].getRange();
  }, [customRange, selectedPreset, presets]);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const handlePresetSelect = useCallback((index: number) => {
    setSelectedPreset(index);
    setCustomRange(null);
  }, []);

  const handleStartDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(false);
    if (date && event.type === 'set') {
      setCustomRange(prev => ({
        startDate: date,
        endDate: prev?.endDate || new Date(),
      }));
    }
  }, []);

  const handleEndDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowEndPicker(false);
    if (date && event.type === 'set') {
      date.setHours(23, 59, 59, 999);
      setCustomRange(prev => ({
        startDate: prev?.startDate || new Date(),
        endDate: date,
      }));
    }
  }, []);

  // Update preview count when filters change
  useEffect(() => {
    let mounted = true;
    const options = {
      dateRange: effectiveDateRange,
      ...(selectedAccountId !== null && { accountId: selectedAccountId }),
      ...(selectedType !== 'ALL' && { type: selectedType as 'CR' | 'DR' }),
    };
    CsvExportService.getTransactionCount(options).then(count => {
      if (mounted) setPreviewCount(count);
    });
    return () => { mounted = false; };
  }, [effectiveDateRange, selectedAccountId, selectedType]);

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true);

      const options = {
        dateRange: effectiveDateRange,
        ...(selectedAccountId !== null && { accountId: selectedAccountId }),
        ...(selectedType !== 'ALL' && { type: selectedType as 'CR' | 'DR' }),
      };

      const result = await CsvExportService.exportToCsv(options);
      setExportedData(result);
      setShowExportOptions(true);
    } catch (error) {
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export transactions'
      );
    } finally {
      setIsExporting(false);
    }
  }, [effectiveDateRange, selectedAccountId, selectedType]);

  const handleSaveToFolder = useCallback(async () => {
    if (!exportedData) return;
    
    setShowExportOptions(false);
    
    try {
      await CsvExportService.saveToFolder(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save CSV'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const handleShare = useCallback(async () => {
    if (!exportedData) return;
    
    setShowExportOptions(false);
    
    try {
      await CsvExportService.shareFile(exportedData.content, exportedData.filename);
    } catch (error) {
      Alert.alert(
        'Share Failed',
        error instanceof Error ? error.message : 'Failed to share CSV'
      );
    } finally {
      setExportedData(null);
    }
  }, [exportedData]);

  const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header title="Export CSV" subtitle="Download your data" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumGuard label="CSV Export">
          <View style={styles.heroCard}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="document-text" size={32} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Export to Spreadsheet</Text>
            <Text style={styles.heroSubtitle}>
              Export your transactions as CSV. Choose to save to a folder or share to other apps.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATE RANGE</Text>
            <View style={styles.card}>
              {presets.map((preset, index) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.presetRow,
                    index === presets.length - 1 && styles.presetRowLast,
                  ]}
                  onPress={() => handlePresetSelect(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetLeft}>
                    <View style={[
                      styles.radioCircle,
                      selectedPreset === index && !customRange && { borderColor: colors.primary, borderWidth: 2 },
                    ]}>
                      {selectedPreset === index && !customRange && (
                        <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <Text style={styles.presetLabel}>{preset.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.presetRow, styles.presetRowLast]}
                onPress={() => setShowStartPicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.presetLeft}>
                  <View style={[
                    styles.radioCircle,
                    customRange && { borderColor: colors.primary, borderWidth: 2 },
                  ]}>
                    {customRange && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={styles.presetLabel}>Custom Range</Text>
                </View>
              </TouchableOpacity>

              {customRange && (
                <View style={styles.customDatesContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateLabel}>From</Text>
                    <Text style={styles.dateValue}>{formatDate(customRange.startDate)}</Text>
                  </TouchableOpacity>
                  <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateValue}>{formatDate(customRange.endDate)}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={customRange?.startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              maximumDate={new Date()}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={customRange?.endDate || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              maximumDate={new Date()}
            />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACCOUNT (OPTIONAL)</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.filterRow, selectedAccountId === null && styles.filterRowSelected]}
                onPress={() => setSelectedAccountId(null)}
                activeOpacity={0.7}
              >
                <View style={styles.filterLeft}>
                  <View style={[styles.filterIconBox, { backgroundColor: colors.surface }]}>
                    <Ionicons name="wallet-outline" size={16} color={colors.textMuted} />
                  </View>
                  <Text style={styles.filterLabel}>All Accounts</Text>
                </View>
                {selectedAccountId === null && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>

              {accountsQuery.data?.map((account, index) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.filterRow,
                    index === (accountsQuery.data?.length || 0) - 1 && styles.filterRowLast,
                    selectedAccountId === account.id && styles.filterRowSelected,
                  ]}
                  onPress={() => setSelectedAccountId(account.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.filterLeft}>
                    <View style={[styles.filterIconBox, { backgroundColor: toHexColor(account.color) + '20' }]}>
                      <Ionicons name={account.icon as any} size={16} color={toHexColor(account.color)} />
                    </View>
                    <Text style={styles.filterLabel}>{account.name}</Text>
                  </View>
                  {selectedAccountId === account.id && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TYPE (OPTIONAL)</Text>
            <View style={styles.typeGrid}>
              {(['ALL', 'CR', 'DR'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeChip,
                    selectedType === type && { backgroundColor: colors.text },
                  ]}
                  onPress={() => setSelectedType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.typeChipText,
                    selectedType === type && { color: colors.background },
                  ]}>
                    {type === 'ALL' ? 'All' : type === 'CR' ? 'Income' : 'Expense'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Transactions to export</Text>
              <Text style={styles.summaryValue}>
                {previewCount !== null ? previewCount.toLocaleString() : '...'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date range</Text>
              <Text style={styles.summaryValueSmall}>
                {formatDate(effectiveDateRange.startDate)} - {formatDate(effectiveDateRange.endDate)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.exportButton, isExporting && { opacity: 0.7 }]}
            onPress={handleExport}
            disabled={isExporting || previewCount === 0}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color={colors.background} />
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </>
            )}
          </TouchableOpacity>

          {previewCount === 0 && (
            <View style={styles.warningCard}>
              <Ionicons name="information-circle-outline" size={18} color={colors.warning || colors.textMuted} />
              <Text style={styles.warningText}>
                No transactions match the selected filters. Adjust your date range or filters.
              </Text>
            </View>
          )}
        </PremiumGuard>
      </ScrollView>

      <OptionsDialog
        visible={showExportOptions}
        onClose={() => {
          setShowExportOptions(false);
          setExportedData(null);
        }}
        title="Export Complete"
        subtitle={exportedData ? `${previewCount?.toLocaleString()} transactions` : 'Choose how to save your CSV'}
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
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 48,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      marginBottom: 32,
    },
    heroIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    heroTitle: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 20,
      color: colors.text,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 2,
      marginBottom: 12,
      paddingLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
    },
    presetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    presetRowLast: {
      borderBottomWidth: 0,
    },
    presetLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    presetLabel: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    customDatesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      paddingTop: 8,
      backgroundColor: colors.background,
    },
    dateButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    dateValue: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
      color: colors.text,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 14,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    filterRowLast: {
      borderBottomWidth: 0,
    },
    filterRowSelected: {
      backgroundColor: colors.primary + '08',
    },
    filterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    filterIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterLabel: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 15,
      color: colors.text,
    },
    typeGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    typeChip: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    typeChipText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      gap: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    summaryLabel: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.textMuted,
    },
    summaryValue: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 20,
      color: colors.text,
    },
    summaryValueSmall: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.text,
      marginBottom: 16,
    },
    exportButtonText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 16,
      color: colors.background,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: (colors.warning || '#F59E0B') + '10',
      borderRadius: 12,
      padding: 12,
    },
    warningText: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      color: colors.warning || '#F59E0B',
      lineHeight: 18,
    },
  });
