import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Account } from '@/src/features/accounts/api/accounts';
import { Category } from '@/src/features/categories/api/categories';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { RADIUS, SHADOWS, SPACING } from '@/src/theme/tokens';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { resolveIcon } from '@/src/utils/icons';
import { AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../api/advanced-filters.service';

interface AdvancedFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: AdvancedFilters;
  onApply: (filters: AdvancedFilters) => void;
  onReset: () => void;
  accounts: Account[];
  categories: Category[];
  resultCount: number;
}

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

export const AdvancedFilterSheet = React.memo(function AdvancedFilterSheet({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
  accounts,
  categories,
  resultCount,
}: AdvancedFilterSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [minAmount, setMinAmount] = useState(filters.amountRange?.min?.toString() || '');
  const [maxAmount, setMaxAmount] = useState(filters.amountRange?.max?.toString() || '');

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
      setMinAmount(filters.amountRange?.min?.toString() || '');
      setMaxAmount(filters.amountRange?.max?.toString() || '');
    }
  }, [visible, filters]);

  const toggleSelection = useCallback(<T,>(current: T[] | undefined, value: T): T[] => {
    const arr = current || [];
    if (arr.includes(value)) return arr.filter(item => item !== value);
    return [...arr, value];
  }, []);

  const toggleAccount = useCallback((accountId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      accountIds: toggleSelection(prev.accountIds, accountId),
    }));
  }, [toggleSelection]);

  const toggleCategory = useCallback((categoryId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      categoryIds: toggleSelection(prev.categoryIds, categoryId),
    }));
  }, [toggleSelection]);

  const toggleType = useCallback((type: 'CR' | 'DR') => {
    setLocalFilters(prev => ({
      ...prev,
      types: toggleSelection(prev.types, type),
    }));
  }, [toggleSelection]);

  const handleStartDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowStartDatePicker(false);
    if (date && event.type === 'set') {
      setLocalFilters(prev => ({
        ...prev,
        dateRange: {
          startDate: date,
          endDate: prev.dateRange?.endDate || new Date(),
        },
      }));
    }
  }, []);

  const handleEndDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowEndDatePicker(false);
    if (date && event.type === 'set') {
      date.setHours(23, 59, 59, 999);
      setLocalFilters(prev => ({
        ...prev,
        dateRange: {
          startDate: prev.dateRange?.startDate || new Date(),
          endDate: date,
        },
      }));
    }
  }, []);

  const clearDateRange = useCallback(() => {
    setLocalFilters(prev => ({ ...prev, dateRange: undefined }));
  }, []);

  const handleApply = useCallback(() => {
    const min = minAmount ? parseFloat(minAmount) : undefined;
    const max = maxAmount ? parseFloat(maxAmount) : undefined;
    const finalFilters: AdvancedFilters = {
      ...localFilters,
      amountRange: (min !== undefined || max !== undefined) ? { min, max } : undefined,
    };
    onApply(finalFilters);
    onClose();
  }, [localFilters, minAmount, maxAmount, onApply, onClose]);

  const handleReset = useCallback(() => {
    setLocalFilters(DEFAULT_ADVANCED_FILTERS);
    setMinAmount('');
    setMaxAmount('');
    onReset();
  }, [onReset]);

  const activeFilterCount = useMemo(() =>
    (localFilters.accountIds?.length || 0) +
    (localFilters.categoryIds?.length || 0) +
    (localFilters.types?.length || 0) +
    (localFilters.dateRange ? 1 : 0) +
    (minAmount || maxAmount ? 1 : 0) +
    (localFilters.searchQuery?.trim() ? 1 : 0),
    [localFilters, minAmount, maxAmount]
  );

  const formatDate = useCallback((date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    []
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Filters</Text>
              {activeFilterCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </View>
            {activeFilterCount > 0 ? (
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <Text style={styles.resetBtnText}>Reset all</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.closeIconBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Search — always visible, above scroll */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={localFilters.searchQuery || ''}
                onChangeText={(text) => setLocalFilters(prev => ({ ...prev, searchQuery: text }))}
                placeholder="Notes, categories, accounts..."
                placeholderTextColor={colors.textMuted + '80'}
              />
              {!!localFilters.searchQuery && (
                <TouchableOpacity onPress={() => setLocalFilters(prev => ({ ...prev, searchQuery: '' }))}>
                  <Ionicons name="close-circle" size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* TYPE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TYPE</Text>
              <View style={styles.typeRow}>
                {(['CR', 'DR'] as const).map((type) => {
                  const isSelected = localFilters.types?.includes(type) || false;
                  const accentColor = type === 'CR' ? colors.success : colors.danger;
                  const icon = type === 'CR' ? 'arrow-down' : 'arrow-up';
                  const label = type === 'CR' ? 'Income' : 'Expense';

                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeCard,
                        isSelected && { backgroundColor: accentColor + '12' },
                      ]}
                      onPress={() => toggleType(type)}
                      activeOpacity={0.75}
                    >
                      <View style={[
                        styles.typeAccentBar,
                        { backgroundColor: isSelected ? accentColor : colors.text + '15' },
                      ]} />
                      <View style={styles.typeBody}>
                        <View style={[styles.typeIconBox, { backgroundColor: accentColor + '18' }]}>
                          <Ionicons name={icon} size={15} color={accentColor} />
                        </View>
                        <Text style={[
                          styles.typeLabel,
                          { color: isSelected ? accentColor : colors.textMuted },
                        ]}>
                          {label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DATE RANGE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>DATE RANGE</Text>
              <View style={styles.card}>
                {localFilters.dateRange ? (
                  <View style={styles.dateActiveRow}>
                    <TouchableOpacity
                      style={styles.dateField}
                      onPress={() => setShowStartDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dateFieldLabel}>FROM</Text>
                      <Text style={styles.dateFieldValue}>
                        {formatDate(localFilters.dateRange.startDate)}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.dateFieldSep} />
                    <TouchableOpacity
                      style={styles.dateField}
                      onPress={() => setShowEndDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dateFieldLabel}>TO</Text>
                      <Text style={styles.dateFieldValue}>
                        {formatDate(localFilters.dateRange.endDate)}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clearDateRange} style={styles.dateClearBtn}>
                      <Ionicons name="close" size={13} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.dateInactiveRow}>
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => setShowStartDatePicker(true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={styles.datePickerBtnText}>Set start date</Text>
                    </TouchableOpacity>
                    <View style={styles.datePickerInternalSep} />
                    <TouchableOpacity
                      style={styles.datePickerBtn}
                      onPress={() => setShowEndDatePicker(true)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                      <Text style={styles.datePickerBtnText}>Set end date</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* AMOUNT RANGE */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>AMOUNT RANGE</Text>
              <View style={styles.card}>
                <View style={styles.amountRow}>
                  <View style={styles.amountField}>
                    <Text style={styles.amountFieldLabel}>MIN</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={minAmount}
                      onChangeText={setMinAmount}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted + '60'}
                      returnKeyType="done"
                    />
                  </View>
                  <View style={styles.amountFieldSep} />
                  <View style={styles.amountField}>
                    <Text style={styles.amountFieldLabel}>MAX</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                      keyboardType="decimal-pad"
                      placeholder="Any"
                      placeholderTextColor={colors.textMuted + '60'}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* ACCOUNTS */}
            {accounts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>ACCOUNTS</Text>
                <View style={styles.card}>
                  {accounts.map((account, index) => {
                    const isSelected = localFilters.accountIds?.includes(account.id) || false;
                    const isLast = index === accounts.length - 1;
                    const accColor = toHexColor(account.color);

                    return (
                      <TouchableOpacity
                        key={account.id}
                        style={[
                          styles.listRow,
                          !isLast && styles.listRowDivider,
                          isSelected && styles.listRowActive,
                        ]}
                        onPress={() => toggleAccount(account.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.listIconBox, { backgroundColor: accColor + '18' }]}>
                          <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={16} color={accColor} />
                        </View>
                        <Text style={[
                          styles.listRowLabel,
                          isSelected && { color: colors.text },
                        ]}>
                          {account.name}
                        </Text>
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxActive,
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={11} color={colors.background} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* CATEGORIES */}
            {categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>CATEGORIES</Text>
                <View style={styles.chipGrid}>
                  {categories.map((category) => {
                    const isSelected = localFilters.categoryIds?.includes(category.id) || false;
                    const catColor = toHexColor(category.color);

                    return (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.chip,
                          isSelected && {
                            backgroundColor: catColor + '18',
                          },
                        ]}
                        onPress={() => toggleCategory(category.id)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={resolveIcon(category.icon, 'pricetag-outline')}
                          size={13}
                          color={isSelected ? catColor : colors.textMuted}
                        />
                        <Text style={[
                          styles.chipText,
                          isSelected && { color: catColor },
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* SORT */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SORT</Text>
              <View style={styles.card}>
                <View style={styles.sortRow}>
                  <Text style={styles.sortRowLabel}>Sort by</Text>
                  <View style={styles.sortToggleGroup}>
                    {(['date', 'amount'] as const).map((sortBy) => {
                      const isActive = localFilters.sortBy === sortBy;
                      return (
                        <TouchableOpacity
                          key={sortBy}
                          style={[styles.sortToggle, isActive && styles.sortToggleActive]}
                          onPress={() => setLocalFilters(prev => ({ ...prev, sortBy }))}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.sortToggleText, isActive && styles.sortToggleTextActive]}>
                            {sortBy === 'date' ? 'Date' : 'Amount'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.sortRowSep} />
                <View style={styles.sortRow}>
                  <Text style={styles.sortRowLabel}>Order</Text>
                  <View style={styles.sortToggleGroup}>
                    {([
                      { order: 'desc' as const, label: 'Newest', icon: 'arrow-down' as const },
                      { order: 'asc' as const, label: 'Oldest', icon: 'arrow-up' as const },
                    ]).map(({ order, label, icon }) => {
                      const isActive = localFilters.sortOrder === order;
                      return (
                        <TouchableOpacity
                          key={order}
                          style={[styles.sortToggle, isActive && styles.sortToggleActive]}
                          onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: order }))}
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name={icon}
                            size={11}
                            color={isActive ? colors.background : colors.textMuted}
                          />
                          <Text style={[styles.sortToggleText, isActive && styles.sortToggleTextActive]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            <View style={{ height: 110 }} />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
              <Text style={styles.applyBtnText}>
                Show {resultCount} result{resultCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={localFilters.dateRange?.startDate || new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              maximumDate={new Date()}
            />
          )}
          {showEndDatePicker && (
            <DateTimePicker
              value={localFilters.dateRange?.endDate || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: Platform.OS === 'ios' ? colors.background + 'F5' : colors.background,
      borderTopLeftRadius: RADIUS['2xl'],
      borderTopRightRadius: RADIUS['2xl'],
      borderWidth: 1,
      borderColor: colors.text + '15',
      borderBottomWidth: 0,
      maxHeight: '88%',
      ...SHADOWS.lg,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: RADIUS.xs,
      backgroundColor: colors.text + '20',
      alignSelf: 'center',
      marginTop: SPACING['2.5'],
    },

    // ─── Header ─────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['4'],
      paddingBottom: SPACING['2'],
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['2'],
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      color: colors.text,
      letterSpacing: -1,
    },
    countBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: RADIUS.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING['1'],
    },
    countBadgeText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.background,
    },
    resetBtn: {
      height: 30,
      paddingHorizontal: SPACING['3'],
      borderRadius: RADIUS.md,
      backgroundColor: colors.danger + '12',
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetBtnText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 12,
      color: colors.danger,
    },
    closeIconBtn: {
      width: 30,
      height: 30,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.text + '08',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ─── Search ──────────────────────────────────────────────────────────────
    searchRow: {
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['2'],
      paddingBottom: SPACING['3'],
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      paddingHorizontal: SPACING['3'],
      gap: SPACING['2'],
    },
    searchInput: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      color: colors.text,
      padding: 0,
    },

    // ─── Scroll body ─────────────────────────────────────────────────────────
    scrollContent: {
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['1'],
    },
    section: {
      marginBottom: SPACING['5'],
    },
    sectionLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: SPACING['2'],
      paddingLeft: SPACING['1'],
    },

    // ─── Shared card surface ─────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
    },

    // ─── Type ────────────────────────────────────────────────────────────────
    typeRow: {
      flexDirection: 'row',
      gap: SPACING['2'],
    },
    typeCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: 60,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    typeAccentBar: {
      width: 3,
      alignSelf: 'stretch',
      marginVertical: SPACING['3'],
      marginLeft: SPACING['1.5'],
      borderRadius: RADIUS.full,
    },
    typeBody: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING['3'],
      gap: SPACING['2'],
    },
    typeIconBox: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    typeLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
    },

    // ─── Date range ──────────────────────────────────────────────────────────
    dateActiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING['4'],
      paddingVertical: SPACING['3'],
    },
    dateField: {
      flex: 1,
      paddingVertical: SPACING['1'],
    },
    dateFieldLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: SPACING['0.5'],
    },
    dateFieldValue: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
      color: colors.text,
      letterSpacing: -0.3,
    },
    dateFieldSep: {
      width: 1,
      height: 36,
      backgroundColor: colors.text + '10',
      marginHorizontal: SPACING['3'],
    },
    dateClearBtn: {
      width: 26,
      height: 26,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.text + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: SPACING['2'],
    },
    dateInactiveRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    datePickerBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING['2'],
      paddingVertical: SPACING['4'],
    },
    datePickerInternalSep: {
      width: 1,
      height: 24,
      backgroundColor: colors.text + '10',
    },
    datePickerBtnText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
      color: colors.primary,
    },

    // ─── Amount range ────────────────────────────────────────────────────────
    amountRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    amountField: {
      flex: 1,
      paddingHorizontal: SPACING['4'],
      paddingVertical: SPACING['3'],
      gap: SPACING['1'],
    },
    amountFieldLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 8,
      color: colors.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    amountInput: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 22,
      color: colors.text,
      letterSpacing: -0.5,
      padding: 0,
    },
    amountFieldSep: {
      width: 1,
      backgroundColor: colors.text + '10',
      marginVertical: SPACING['3'],
    },

    // ─── Account / Category list rows ─────────────────────────────────────
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING['4'],
      paddingVertical: SPACING['3'],
      gap: SPACING['3'],
    },
    listRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.text + '08',
    },
    listRowActive: {
      backgroundColor: colors.text + '05',
    },
    listIconBox: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listRowLabel: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 14,
      color: colors.textMuted,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: RADIUS.xs,
      borderWidth: 1.5,
      borderColor: colors.text + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },

    // ─── Category chips ──────────────────────────────────────────────────────
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING['2'],
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING['3'],
      height: 34,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      gap: SPACING['1'],
    },
    chipText: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
      color: colors.textMuted,
    },

    // ─── Sort ────────────────────────────────────────────────────────────────
    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING['4'],
      paddingVertical: SPACING['3'],
    },
    sortRowSep: {
      height: 1,
      backgroundColor: colors.text + '08',
      marginHorizontal: SPACING['4'],
    },
    sortRowLabel: {
      fontFamily: TYPOGRAPHY.fonts.medium,
      fontSize: 13,
      color: colors.textMuted,
    },
    sortToggleGroup: {
      flexDirection: 'row',
      gap: SPACING['1.5'],
    },
    sortToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['1'],
      paddingHorizontal: SPACING['3'],
      height: 30,
      borderRadius: RADIUS.md,
      backgroundColor: colors.text + '08',
    },
    sortToggleActive: {
      backgroundColor: colors.text,
    },
    sortToggleText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
    },
    sortToggleTextActive: {
      color: colors.background,
    },

    // ─── Footer ──────────────────────────────────────────────────────────────
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['4'],
      paddingBottom: SPACING['9'],
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.text + '08',
    },
    applyBtn: {
      height: 52,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    applyBtnText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
      color: colors.background,
    },
  });
