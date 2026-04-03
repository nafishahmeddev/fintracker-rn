import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  SectionList,
  Platform,
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
import { TYPOGRAPHY } from '../../../theme/typography';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import type { TransactionListItem } from '../api/transactions';
import { TransactionFilterSheet } from '../components/TransactionFilterSheet';
import {
  useDeleteTransaction,
  useInfiniteTransactions,
  useTransactionsCount,
} from '../hooks/transactions';

type TransactionTypeFilter = 'ALL' | 'CR' | 'DR';

const SWIPE_ACTION_WIDTH = 44;
type SwipeableInstance = React.ComponentRef<typeof Swipeable>;
let openSwipeRow: SwipeableInstance | null = null;

const resolveParamNumber = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getDateLabel = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

// ─── Swipeable row ───────────────────────────────────────────────────────────
const SwipeableRow = React.memo(function SwipeableRow({
  tx,
  isFirst,
  isLast,
  colors,
  onEdit,
  onDelete,
}: {
  tx: TransactionListItem;
  isFirst: boolean;
  isLast: boolean;
  colors: ThemeColors;
  onEdit: (tx: TransactionListItem) => void;
  onDelete: (tx: TransactionListItem) => void;
}) {
  const swipeRef = React.useRef<SwipeableInstance>(null);

  const handleEdit = React.useCallback(() => {
    swipeRef.current?.close();
    onEdit(tx);
  }, [onEdit, tx]);

  const handleDelete = React.useCallback(() => {
    swipeRef.current?.close();
    onDelete(tx);
  }, [onDelete, tx]);

  const renderRightActions = React.useCallback(
    () => {
      return (
        <View
          style={{
            flexDirection: 'row',
            width: SWIPE_ACTION_WIDTH * 2,
            alignItems: 'stretch',
            justifyContent: 'flex-end',
          }}
        >
          <TouchableOpacity
            onPress={handleEdit}
            activeOpacity={0.85}
            style={{
              width: SWIPE_ACTION_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary + '1A',
            }}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.85}
            style={{
              width: SWIPE_ACTION_WIDTH,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.danger + '1A',
            }}
          >
            <Ionicons name="trash" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      );
    },
    [handleEdit, handleDelete, colors],
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={30}
      friction={1.8}
      overshootRight={false}
      onSwipeableWillOpen={() => {
        if (openSwipeRow && openSwipeRow !== swipeRef.current) {
          openSwipeRow.close();
        }
        openSwipeRow = swipeRef.current;
      }}
      onSwipeableClose={() => {
        if (openSwipeRow === swipeRef.current) {
          openSwipeRow = null;
        }
      }}
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
  const params = useLocalSearchParams<{ accountId?: string | string[] }>();
  const initialAccountId = React.useMemo(() => resolveParamNumber(params.accountId), [params.accountId]);

  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [typeFilter, setTypeFilter] = React.useState<TransactionTypeFilter>('ALL');
  const [accountFilterId, setAccountFilterId] = React.useState<number | null>(null);
  const [categoryFilterId, setCategoryFilterId] = React.useState<number | null>(null);
  const [showFilterSheet, setShowFilterSheet] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [pendingDeleteTx, setPendingDeleteTx] = React.useState<TransactionListItem | null>(null);

  React.useEffect(() => {
    if (initialAccountId !== null) setAccountFilterId(initialAccountId);
  }, [initialAccountId]);

  const filters = React.useMemo(
    () => ({
      ...(typeFilter !== 'ALL' ? { type: typeFilter as 'CR' | 'DR' } : {}),
      ...(accountFilterId !== null ? { accountId: accountFilterId } : {}),
      ...(categoryFilterId !== null ? { categoryId: categoryFilterId } : {}),
    }),
    [typeFilter, accountFilterId, categoryFilterId],
  );

  const txQuery = useInfiniteTransactions(filters);
  const txCountQuery = useTransactionsCount(filters);
  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const deleteTransaction = useDeleteTransaction();

  const transactions = React.useMemo(
    () => txQuery.data?.pages.flat() ?? [],
    [txQuery.data],
  );

  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, TransactionListItem[]>();
    transactions.forEach((item) => {
      const key = getDateLabel(item.datetime);
      const prev = map.get(key) ?? [];
      prev.push(item);
      map.set(key, prev);
    });
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [transactions]);

  const loadMore = React.useCallback(() => {
    if (txQuery.hasNextPage && !txQuery.isFetchingNextPage) {
      txQuery.fetchNextPage();
    }
  }, [txQuery]);

  const kpiTotalsByCurrency = React.useMemo(() => {
    const source =
      accountFilterId !== null
        ? (accountsQuery.data ?? []).filter((a) => a.id === accountFilterId)
        : (accountsQuery.data ?? []);
    const map: Record<string, { income: number; expense: number }> = {};
    source.forEach((acc) => {
      const cur = acc.currency;
      if (!map[cur]) map[cur] = { income: 0, expense: 0 };
      map[cur].income += acc.income;
      map[cur].expense += acc.expense;
    });
    return map;
  }, [accountsQuery.data, accountFilterId]);

  const kpiCurrencies = React.useMemo(() => Object.keys(kpiTotalsByCurrency), [kpiTotalsByCurrency]);

  const [selectedKpiCurrency, setSelectedKpiCurrency] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (kpiCurrencies.length === 0) setSelectedKpiCurrency(null);
    else if (!selectedKpiCurrency || !kpiCurrencies.includes(selectedKpiCurrency))
      setSelectedKpiCurrency(kpiCurrencies[0]);
  }, [kpiCurrencies, selectedKpiCurrency]);

  const activeTotals = selectedKpiCurrency
    ? (kpiTotalsByCurrency[selectedKpiCurrency] ?? { income: 0, expense: 0 })
    : { income: 0, expense: 0 };

  const activeFilterCount =
    (typeFilter !== 'ALL' ? 1 : 0) + (accountFilterId !== null ? 1 : 0) + (categoryFilterId !== null ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter('ALL');
    setAccountFilterId(null);
    setCategoryFilterId(null);
  };

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

  const renderItem = React.useCallback(({ item: tx, index, section }: any) => {
    return (
      <SwipeableRow
        tx={tx}
        isFirst={index === 0}
        isLast={index === section.data.length - 1}
        colors={colors}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  }, [colors, handleEdit, handleDelete]);

  const renderSectionHeader = React.useCallback(({ section: { title, data } }: any) => {
    const dayTotal = data.reduce(
      (acc: any, tx: any) => {
        if (tx.type === 'CR') acc.in += tx.amount;
        else acc.out += tx.amount;
        return acc;
      },
      { in: 0, out: 0 },
    );
    return (
      <View style={[styles.dayHeaderRow, { marginBottom: 12 }]}>
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
  }, [styles]);

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
        subtitle={`${txCountQuery.data ?? 0} records`}
        showBack
        rightAction={(
          <TouchableOpacity style={styles.filterActionBtn} onPress={() => setShowFilterSheet(true)} activeOpacity={0.9}>
            <Ionicons name="filter-outline" size={20} color={colors.text} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <SectionList
        sections={groupedByDate}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={() => <View style={{ height: 24 }} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={11}
        removeClippedSubviews={Platform.OS === 'android'}
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

      <TransactionFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        accountFilterId={accountFilterId}
        setAccountFilterId={setAccountFilterId}
        categoryFilterId={categoryFilterId}
        setCategoryFilterId={setCategoryFilterId}
        accounts={accountsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        totalCount={txCountQuery.data ?? 0}
        activeFilterCount={activeFilterCount}
        onClear={clearFilters}
        colors={colors}
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
    filterActionBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
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
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 120,
    },
    listHeader: {
      gap: 20,
      marginBottom: 24,
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
      backgroundColor: colors.danger + '15',
      paddingHorizontal: 12,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearChipText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.danger,
    },
    daySection: { gap: 12 },
    dayHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
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
      gap: 12,
    },
    dayTotalValue: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 12,
    },
    dayCard: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    emptyWrap: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: 16,
    },
    emptyIconBox: {
      width: 80,
      height: 80,
      borderRadius: 28,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
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
      gap: 10,
      paddingHorizontal: 20,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.text,
      marginTop: 8,
    },
    emptyActionText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.background,
      fontSize: 15,
    },
    loadMoreWrap: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    fab: {
      position: 'absolute',
      bottom: 34,
      right: 24,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  });
