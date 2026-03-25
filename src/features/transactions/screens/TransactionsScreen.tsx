import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
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
import { MoneyText } from '../../../components/ui/MoneyText';
import { KPICard } from '../../../components/ui/KPICard';
import { TransactionRow } from '../../../components/ui/TransactionRow';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import type { TransactionListItem } from '../api/transactions';
import {
  useDeleteTransaction,
  useInfiniteTransactions,
  useTransactionsCount,
} from '../hooks/transactions';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

type TransactionTypeFilter = 'ALL' | 'CR' | 'DR';

const SWIPE_ACTION_WIDTH = 44;
type SwipeableInstance = React.ElementRef<typeof Swipeable>;
let openSwipeRow: SwipeableInstance | null = null;

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

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
    return [...map.entries()];
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
            <Ionicons name="options-outline" size={18} color={colors.text} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={groupedByDate}
        keyExtractor={(item) => item[0]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
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
                <Text style={styles.activeFiltersLabel}>FILTERS</Text>
                <TouchableOpacity style={styles.clearChip} onPress={clearFilters}>
                  <Ionicons name="close" size={11} color={colors.background} />
                  <Text style={styles.clearChipText}>Clear all</Text>
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
        renderItem={({ item }) => {
          const [dateLabel, items] = item;
          const dayTotal = items.reduce(
            (acc, tx) => {
              if (tx.type === 'CR') acc.in += tx.amount;
              else acc.out += tx.amount;
              return acc;
            },
            { in: 0, out: 0 },
          );
          return (
            <View style={styles.daySection}>
              <View style={styles.dayHeaderRow}>
                <Text style={styles.dayTitle}>{dateLabel}</Text>
                <View style={styles.dayTotals}>
                  {dayTotal.in > 0 && (
                    <MoneyText amount={dayTotal.in} type="CR" weight="bold" style={styles.dayTotalValue} />
                  )}
                  {dayTotal.out > 0 && (
                    <MoneyText amount={dayTotal.out} type="DR" weight="bold" style={styles.dayTotalValue} />
                  )}
                </View>
              </View>
              <View style={styles.dayCard}>
                {items.map((tx, idx) => (
                  <SwipeableRow
                    key={tx.id}
                    tx={tx}
                    isFirst={idx === 0}
                    isLast={idx === items.length - 1}
                    colors={colors}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </View>
            </View>
          );
        }}
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

      {/* Filter bottom sheet */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowFilterSheet(false)} />
          <View style={styles.sheetCard}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeadRow}>
              <Text style={styles.sheetTitle}>Filters</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity style={styles.sheetClearBtn} onPress={clearFilters}>
                  <Text style={styles.sheetClearBtnText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetLabel}>Type</Text>
              <View style={styles.sheetChipsWrap}>
                {([
                  { key: 'ALL' as const, label: 'All', icon: 'list-outline' as const },
                  { key: 'CR' as const, label: 'Income', icon: 'arrow-down-outline' as const },
                  { key: 'DR' as const, label: 'Expense', icon: 'arrow-up-outline' as const },
                ]).map((typeOption) => {
                  const selected = typeFilter === typeOption.key;
                  return (
                    <TouchableOpacity
                      key={typeOption.key}
                      style={[styles.sheetChip, selected && styles.sheetChipActive]}
                      onPress={() => setTypeFilter(typeOption.key)}
                    >
                      <Ionicons
                        name={typeOption.icon}
                        size={14}
                        color={selected ? colors.background : colors.textMuted}
                      />
                      <Text style={[styles.sheetChipText, selected && styles.sheetChipTextActive]}>
                        {typeOption.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sheetLabel}>Account</Text>
              <View style={styles.sheetChipsWrap}>
                <TouchableOpacity
                  style={[styles.sheetChip, accountFilterId === null && styles.sheetChipActive]}
                  onPress={() => setAccountFilterId(null)}
                >
                  <Text style={[styles.sheetChipText, accountFilterId === null && styles.sheetChipTextActive]}>All</Text>
                </TouchableOpacity>
                {(accountsQuery.data ?? []).map((account) => {
                  const selected = accountFilterId === account.id;
                  const accColor = toHexColor(account.color);
                  return (
                    <TouchableOpacity
                      key={account.id}
                      style={[styles.sheetChip, selected && styles.sheetChipActive]}
                      onPress={() => setAccountFilterId(account.id)}
                    >
                      {selected && <View style={[styles.sheetChipDot, { backgroundColor: accColor }]} />}
                      <Text style={[styles.sheetChipText, selected && styles.sheetChipTextActive]}>{account.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sheetLabel, { marginTop: 16 }]}>Category</Text>
              <View style={styles.sheetChipsWrap}>
                <TouchableOpacity
                  style={[styles.sheetChip, categoryFilterId === null && styles.sheetChipActive]}
                  onPress={() => setCategoryFilterId(null)}
                >
                  <Text style={[styles.sheetChipText, categoryFilterId === null && styles.sheetChipTextActive]}>All</Text>
                </TouchableOpacity>
                {(categoriesQuery.data ?? []).map((category) => {
                  const selected = categoryFilterId === category.id;
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.sheetChip, selected && styles.sheetChipActive]}
                      onPress={() => setCategoryFilterId(category.id)}
                    >
                      <Text style={[styles.sheetChipText, selected && styles.sheetChipTextActive]}>{category.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.sheetApplyBtn} onPress={() => setShowFilterSheet(false)}>
              <Text style={styles.sheetApplyBtnText}>Apply Filters</Text>
              {activeFilterCount > 0 && (
                <View style={styles.sheetApplyBadge}>
                  <Text style={styles.sheetApplyBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    loadingWrap: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterActionBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    filterBadgeText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 9,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 120,
    },
    listHeader: {
      gap: 16,
      paddingBottom: 16,
    },
    loadMoreWrap: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    activeFiltersRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: -4,
    },
    activeFiltersLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.3,
    },
    clearChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 26,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: colors.danger,
    },
    clearChipText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.background,
    },
    daySection: { gap: 8 },
    dayHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    dayTitle: {
      color: colors.textMuted,
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    dayTotals: {
      flexDirection: 'row',
      gap: 10,
    },
    dayTotalValue: {
      fontSize: 12,
    },
    dayCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    emptyWrap: {
      paddingVertical: 40,
      alignItems: 'center',
      gap: 12,
    },
    emptyIconBox: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 16,
    },
    emptySubtitle: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
    },
    emptyAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.text,
      marginTop: 8,
    },
    emptyActionText: {
      fontFamily: typography.fonts.semibold,
      color: colors.background,
      fontSize: 14,
    },
    fab: {
      position: 'absolute',
      bottom: 40,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheetCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingBottom: 40,
      maxHeight: '80%',
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginVertical: 12,
    },
    sheetHeadRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    sheetTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 24,
      color: colors.text,
    },
    sheetClearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.danger + '1A',
    },
    sheetClearBtnText: {
      fontFamily: typography.fonts.semibold,
      color: colors.danger,
      fontSize: 13,
    },
    sheetLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.25,
      marginBottom: 12,
    },
    sheetChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetChipActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    sheetChipText: {
      fontFamily: typography.fonts.medium,
      fontSize: 13,
      color: colors.textMuted,
    },
    sheetChipTextActive: {
      color: colors.background,
    },
    sheetChipDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    sheetApplyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 52,
      borderRadius: 18,
      backgroundColor: colors.text,
      marginTop: 10,
    },
    sheetApplyBtnText: {
      fontFamily: typography.fonts.semibold,
      color: colors.background,
      fontSize: 16,
    },
    sheetApplyBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetApplyBadgeText: {
      fontSize: 10,
      color: colors.background,
      fontFamily: typography.fonts.semibold,
    },
  });
