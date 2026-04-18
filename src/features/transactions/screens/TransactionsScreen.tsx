import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Header } from '../../../components/ui/Header';
import { KPICard } from '../../../components/ui/KPICard';
import { MoneyText } from '../../../components/ui/MoneyText';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { RADIUS, SHADOWS, SPACING } from '../../../theme/tokens';
import { TYPOGRAPHY } from '../../../theme/typography';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { AdvancedFilterService, AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../../filters/api/advanced-filters.service';
import { AdvancedFilterSheet } from '../../filters/components/AdvancedFilterSheet';
import type { TransactionListItem } from '../api/transactions';
import {
  useDeleteTransaction,
  useInfiniteTransactions,
} from '../hooks/transactions';

import { format } from 'date-fns';

const SWIPE_ACTION_WIDTH = 44;
type SwipeableInstance = React.ComponentRef<typeof Swipeable>;
let openSwipeRow: SwipeableInstance | null = null;

// Pre-computed styles for swipe actions to avoid recreating on every render
const swipeActionStyles = {
  container: {
    flexDirection: 'row' as const,
    width: SWIPE_ACTION_WIDTH * 2,
    alignItems: 'stretch' as const,
    justifyContent: 'flex-end' as const,
  },
  actionBase: {
    width: SWIPE_ACTION_WIDTH,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

const resolveParamNumber = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDateLabel = (iso: string) => {
  return format(new Date(iso), 'EEE, d MMM');
};


// ─── Optimized Swipeable row ───────────────────────────────────────────────────────────
// Separate component for action buttons to prevent unnecessary re-renders
const SwipeActionButton = React.memo(function SwipeActionButton({
  onPress,
  icon,
  color,
  backgroundColor,
}: {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  backgroundColor: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[swipeActionStyles.actionBase, { backgroundColor }]}
    >
      <Ionicons name={icon} size={18} color={color} />
    </TouchableOpacity>
  );
});

// Pre-computed action render to avoid inline function creation
const RightActions = React.memo(function RightActions({
  onEdit,
  onDelete,
  editBgColor,
  editIconColor,
  deleteBgColor,
  deleteIconColor,
}: {
  onEdit: () => void;
  onDelete: () => void;
  editBgColor: string;
  editIconColor: string;
  deleteBgColor: string;
  deleteIconColor: string;
}) {
  return (
    <View style={swipeActionStyles.container}>
      <SwipeActionButton
        onPress={onEdit}
        icon="pencil"
        color={editIconColor}
        backgroundColor={editBgColor}
      />
      <SwipeActionButton
        onPress={onDelete}
        icon="trash"
        color={deleteIconColor}
        backgroundColor={deleteBgColor}
      />
    </View>
  );
});

const SwipeableRow = React.memo(function SwipeableRow({
  tx,
  isFirst,
  isLast,
  onEdit,
  onDelete,
}: {
  tx: TransactionListItem;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (tx: TransactionListItem) => void;
  onDelete: (tx: TransactionListItem) => void;
}) {
  const { colors } = useTheme(); // Get colors from context to prevent prop-drilling re-renders
  const swipeRef = React.useRef<SwipeableInstance>(null);

  // Use refs to avoid dependency issues while maintaining stable callbacks
  const txRef = React.useRef(tx);
  React.useEffect(() => {
    txRef.current = tx;
  }, [tx]);

  const handleEdit = React.useCallback(() => {
    swipeRef.current?.close();
    onEdit(txRef.current);
  }, [onEdit]); // Stable reference, uses ref for current tx

  const handleDelete = React.useCallback(() => {
    swipeRef.current?.close();
    onDelete(txRef.current);
  }, [onDelete]);

  // Memoize action colors to prevent re-renders of RightActions
  const actionColors = React.useMemo(() => ({
    editBg: colors.primary + '1A',
    editIcon: colors.primary,
    deleteBg: colors.danger + '1A',
    deleteIcon: colors.danger,
  }), [colors.primary, colors.danger]);

  // Use stable render function reference
  const renderRightActions = React.useCallback(
    () => (
      <RightActions
        onEdit={handleEdit}
        onDelete={handleDelete}
        editBgColor={actionColors.editBg}
        editIconColor={actionColors.editIcon}
        deleteBgColor={actionColors.deleteBg}
        deleteIconColor={actionColors.deleteIcon}
      />
    ),
    [handleEdit, handleDelete, actionColors],
  );

  // Stable swipe event handlers
  const onSwipeableWillOpen = React.useCallback(() => {
    if (openSwipeRow && openSwipeRow !== swipeRef.current) {
      openSwipeRow.close();
    }
    openSwipeRow = swipeRef.current;
  }, []);

  const onSwipeableClose = React.useCallback(() => {
    if (openSwipeRow === swipeRef.current) {
      openSwipeRow = null;
    }
  }, []);

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={30}
      friction={1.8}
      overshootRight={false}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableClose={onSwipeableClose}

    >
      <TransactionRow
        tx={tx}
        colors={colors}
        isFirst={isFirst}
        isLast={isLast}
        onPress={handleEdit}
      />
    </Swipeable>
  );
});

export function TransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string | string[]; categoryId?: string | string[] }>();
  const initialAccountId = React.useMemo(() => resolveParamNumber(params.accountId), [params.accountId]);
  const initialCategoryId = React.useMemo(() => resolveParamNumber(params.categoryId), [params.categoryId]);

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(() => {
    const initial: AdvancedFilters = { ...DEFAULT_ADVANCED_FILTERS };
    if (initialAccountId !== null) {
      initial.accountIds = [initialAccountId];
    }
    if (initialCategoryId !== null) {
      initial.categoryIds = [initialCategoryId];
    }
    return initial;
  });
  
  const [showAdvancedFilterSheet, setShowAdvancedFilterSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDeleteTx, setPendingDeleteTx] = useState<TransactionListItem | null>(null);

  // Convert advanced filters to basic API filters
  const basicFilters = useMemo(() => {
    return AdvancedFilterService.toBasicFilters(advancedFilters);
  }, [advancedFilters]);

  // Fetch transactions
  const txQuery = useInfiniteTransactions(basicFilters);
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const deleteTransaction = useDeleteTransaction();

  // Apply client-side filtering for advanced features
  const transactions = useMemo(() => {
    const allTransactions = txQuery.data?.pages.flat() ?? [];
    
    // If no advanced filtering needed, return all
    if (!AdvancedFilterService.requiresClientSideFiltering(advancedFilters)) {
      return allTransactions;
    }
    
    return allTransactions.filter((transaction) => {
      // Date range filter
      if (advancedFilters.dateRange) {
        const txDate = new Date(transaction.datetime);
        const startDate = new Date(advancedFilters.dateRange.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(advancedFilters.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        if (txDate < startDate || txDate > endDate) {
          return false;
        }
      }
      
      // Multi-select type filter
      if (advancedFilters.types && advancedFilters.types.length > 0) {
        if (!advancedFilters.types.includes(transaction.type)) {
          return false;
        }
      }
      
      // Multi-select account filter
      if (advancedFilters.accountIds && advancedFilters.accountIds.length > 0) {
        if (!advancedFilters.accountIds.includes(transaction.accountId)) {
          return false;
        }
      }
      
      // Multi-select category filter
      if (advancedFilters.categoryIds && advancedFilters.categoryIds.length > 0) {
        if (!advancedFilters.categoryIds.includes(transaction.categoryId)) {
          return false;
        }
      }
      
      // Amount range filter
      if (advancedFilters.amountRange) {
        const amount = transaction.amount;
        if (advancedFilters.amountRange.min !== undefined && amount < advancedFilters.amountRange.min) {
          return false;
        }
        if (advancedFilters.amountRange.max !== undefined && amount > advancedFilters.amountRange.max) {
          return false;
        }
      }
      
      // Search in notes/category/account
      if (advancedFilters.searchQuery?.trim()) {
        const query = advancedFilters.searchQuery.toLowerCase().trim();
        const noteMatch = transaction.note.toLowerCase().includes(query);
        const categoryMatch = transaction.category.name.toLowerCase().includes(query);
        const accountMatch = transaction.account.name.toLowerCase().includes(query);
        
        if (!noteMatch && !categoryMatch && !accountMatch) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by selected criteria
      if (advancedFilters.sortBy === 'amount') {
        return advancedFilters.sortOrder === 'asc' 
          ? a.amount - b.amount 
          : b.amount - a.amount;
      }
      
      // Default sort by date
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return advancedFilters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [txQuery.data?.pages, advancedFilters]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, TransactionListItem[]>();
    transactions.forEach((item) => {
      const key = getDateLabel(item.datetime);
      const prev = map.get(key) ?? [];
      prev.push(item);
      map.set(key, prev);
    });
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [transactions]);

  const loadMore = useCallback(() => {
    if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) {
      txQuery.fetchNextPage();
    }
  }, [txQuery]);

  // Calculate KPI totals from filtered transactions
  const kpiTotalsByCurrency = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    
    transactions.forEach((tx) => {
      const currency = tx.account.currency;
      if (!map[currency]) map[currency] = { income: 0, expense: 0 };
      
      if (tx.type === 'CR') {
        map[currency].income += tx.amount;
      } else {
        map[currency].expense += tx.amount;
      }
    });
    
    return map;
  }, [transactions]);

  const kpiCurrencies = useMemo(() => Object.keys(kpiTotalsByCurrency), [kpiTotalsByCurrency]);

  const [selectedKpiCurrency, setSelectedKpiCurrency] = useState<string | null>(null);
  useEffect(() => {
    if (kpiCurrencies.length === 0) setSelectedKpiCurrency(null);
    else if (!selectedKpiCurrency || !kpiCurrencies.includes(selectedKpiCurrency))
      setSelectedKpiCurrency(kpiCurrencies[0]);
  }, [kpiCurrencies, selectedKpiCurrency]);

  const activeTotals = selectedKpiCurrency
    ? (kpiTotalsByCurrency[selectedKpiCurrency] ?? { income: 0, expense: 0 })
    : { income: 0, expense: 0 };

  const activeFilterCount = AdvancedFilterService.countActiveFilters(advancedFilters);

  const clearFilters = () => {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  };

  const handleApplyFilters = useCallback((filters: AdvancedFilters) => {
    setAdvancedFilters(filters);
  }, []);

  const handleResetFilters = useCallback(() => {
    setAdvancedFilters(DEFAULT_ADVANCED_FILTERS);
  }, []);

  const handleEdit = React.useCallback(
    (tx: TransactionListItem) => {
      router.push(`/transactions/edit/${tx.id}`);
    },
    [router],
  );

  const handleDelete = React.useCallback(
    (tx: TransactionListItem) => {
      setPendingDeleteTx(tx);
      setShowDeleteDialog(true);
    },
    [],
  );

  type TxSection = { title: string; data: TransactionListItem[] };

  const renderItem = React.useCallback(
    ({ item: tx, index, section }: SectionListRenderItemInfo<TransactionListItem, TxSection>) => (
      <SwipeableRow
        tx={tx}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [handleEdit, handleDelete],
  );

  // Stable key extractor - prevents unnecessary re-renders
  const keyExtractor = React.useCallback((item: TransactionListItem) => 
    item.id.toString(), []
  );

  type DayTotals = { in: number; out: number };

  const renderSectionHeader = React.useCallback(
    ({ section: { title, data } }: { section: SectionListData<TransactionListItem, TxSection> }) => {
    const dayTotal = data.reduce<DayTotals>(
      (acc, tx) => {
        if (tx.type === 'CR') acc.in += tx.amount;
        else acc.out += tx.amount;
        return acc;
      },
      { in: 0, out: 0 },
    );
    return (
      <View style={styles.dayHeaderRow}>
        <Text style={styles.dayTitle}>{title}</Text>
        <View style={styles.dayTotals}>
          {dayTotal.in > 0 && (
            <MoneyText amount={dayTotal.in} type="CR" style={styles.dayTotalValue} />
          )}
          {dayTotal.out > 0 && (
            <MoneyText amount={dayTotal.out} type="DR" style={styles.dayTotalValue} />
          )}
        </View>
      </View>
    );
  },
  [styles]);


  const renderSectionFooter = React.useCallback(() => <View style={{ height: 24 }} />, []);

  if (txQuery.isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header
        title="Transactions"
        subtitle={`${transactions.length} records`}
        showBack
        rightAction={(
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/search')} activeOpacity={0.85}>
              <Ionicons name="search-outline" size={19} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowAdvancedFilterSheet(true)} activeOpacity={0.9}>
              <Ionicons name="filter-outline" size={19} color={colors.text} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      />

      <SectionList
        sections={groupedByDate}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={12}
        maxToRenderPerBatch={6}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        ListHeaderComponent={(
          <View style={styles.listHeader}>
            <KPICard
              currencies={kpiCurrencies}
              selectedCurrency={selectedKpiCurrency}
              onSelectCurrency={setSelectedKpiCurrency}
              metrics={activeTotals}
              colors={colors}
            />

            {activeFilterCount > 0 && (
              <View style={styles.activeFiltersRow}>
                <Text style={styles.activeFiltersLabel}>ACTIVE FILTERS</Text>
                <TouchableOpacity style={styles.clearChip} onPress={clearFilters}>
                  <Text style={styles.clearChipText}>Clear All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterCount > 0
                ? 'No transactions match the active filters.'
                : 'Add your first transaction to start tracking.'}
            </Text>
            <TouchableOpacity style={styles.emptyAction} onPress={() => router.push('/transactions/create')}>
              <Text style={styles.emptyActionText}>Add Transaction</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.background} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={txQuery.isFetchingNextPage ? (
          <View style={styles.loadMoreWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/transactions/create')} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>

      <ConfirmDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Transaction"
        message="This will remove the transaction and reverse its account balance impact."
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDeleteTx) return;
          deleteTransaction.mutate(pendingDeleteTx.id);
          setPendingDeleteTx(null);
        }}
      />

      <AdvancedFilterSheet
        visible={showAdvancedFilterSheet}
        onClose={() => setShowAdvancedFilterSheet(false)}
        filters={advancedFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        accounts={accountsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        resultCount={transactions.length}
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
    loadingWrap: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['2'],
    },
    headerBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      minWidth: 18,
      height: 18,
      borderRadius: RADIUS.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },
    filterBadgeText: {
      color: colors.background,
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
    },
    content: {
      paddingHorizontal: SPACING['6'],
      paddingTop: SPACING['3'],
      paddingBottom: 120,
    },
    listHeader: {
      gap: SPACING['5'],
      marginBottom: SPACING['6'],
    },
    activeFiltersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activeFiltersLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
    },
    clearChip: {
      backgroundColor: colors.danger + '12',
      paddingHorizontal: SPACING['3'],
      height: 28,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearChipText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.danger,
    },
    daySection: { gap: SPACING['3'] },
    dayHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING['1'],
      marginBottom: SPACING['3'],
    },
    dayTitle: {
      color: colors.textMuted,
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    dayTotals: {
      flexDirection: 'row',
      gap: SPACING['3'],
    },
    dayTotalValue: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 12,
    },
    dayCard: {
      borderRadius: RADIUS.xl,
      overflow: 'hidden',
    },
    emptyWrap: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: SPACING['4'],
    },
    emptyIconBox: {
      width: 80,
      height: 80,
      borderRadius: RADIUS['2xl'],
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
      fontSize: 18,
    },
    emptySubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      maxWidth: 240,
      lineHeight: 20,
    },
    emptyAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['2.5'],
      paddingHorizontal: SPACING['5'],
      height: 48,
      borderRadius: RADIUS.lg,
      backgroundColor: colors.text,
      marginTop: SPACING['2'],
    },
    emptyActionText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.background,
      fontSize: 15,
    },
    loadMoreWrap: {
      paddingVertical: SPACING['7'],
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 34,
      right: SPACING['6'],
      width: 60,
      height: 60,
      borderRadius: RADIUS.xl,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.lg,
    },
  });
