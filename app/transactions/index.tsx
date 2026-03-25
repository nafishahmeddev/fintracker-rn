import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { Header } from '../../src/components/ui/Header';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { useAccounts } from '../../src/features/accounts/hooks/accounts';
import { useCategories } from '../../src/features/categories/hooks/categories';
import type { TransactionListItem } from '../../src/features/transactions/api/transactions';
import {
  useDeleteTransaction,
  useInfiniteTransactions,
  useTransactionsCount,
} from '../../src/features/transactions/hooks/transactions';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type TransactionTypeFilter = 'ALL' | 'CR' | 'DR';

const SWIPE_ACTION_WIDTH = 44;
type SwipeableInstance = React.ElementRef<typeof Swipeable>;
let openSwipeRow: SwipeableInstance | null = null;

type LedgerTransaction = TransactionListItem;

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
  tx: LedgerTransaction;
  isFirst: boolean;
  isLast: boolean;
  colors: ThemeColors;
  onEdit: (tx: LedgerTransaction) => void;
  onDelete: (tx: LedgerTransaction) => void;
}) {
  const swipeRef = React.useRef<SwipeableInstance>(null);
  const categoryColor = toHexColor(tx.category.color);
  const iconName: keyof typeof Ionicons.glyphMap =
    tx.category.icon in Ionicons.glyphMap
      ? (tx.category.icon as keyof typeof Ionicons.glyphMap)
      : 'pricetag-outline';

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
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingRight: 14,
          gap: 10,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
          borderTopLeftRadius: isFirst ? 18 : 0,
          borderBottomLeftRadius: isLast ? 18 : 0,
        }}
        activeOpacity={0.78}
        onPress={handleEdit}
      >
        <View
          style={{
            width: 3,
            alignSelf: 'stretch',
            borderRadius: 999,
            marginLeft: 4,
            marginVertical: 6,
            backgroundColor: tx.type === 'CR' ? colors.success : colors.danger,
          }}
        />
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: categoryColor + '20',
          }}
        >
          <Ionicons name={iconName} size={18} color={categoryColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text
            style={{ color: colors.text, fontFamily: typography.fonts.semibold, fontSize: 14 }}
            numberOfLines={1}
          >
            {tx.note || tx.category.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: categoryColor }} />
            <Text
              style={{ color: colors.textMuted, fontFamily: typography.fonts.regular, fontSize: 12 }}
              numberOfLines={1}
            >
              {tx.category.name}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12 }}>·</Text>
            <Text
              style={{ color: colors.textMuted, fontFamily: typography.fonts.regular, fontSize: 12 }}
              numberOfLines={1}
            >
              {tx.account.name}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <MoneyText
            amount={tx.amount}
            currency={tx.account.currency}
            type={tx.type}
            weight="bold"
            style={{ fontSize: 14 }}
          />
          <Text style={{ color: colors.textMuted, fontFamily: typography.fonts.regular, fontSize: 11 }}>
            {new Date(tx.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
});

export default function TransactionsScreen() {
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
  const [pendingDeleteTx, setPendingDeleteTx] = React.useState<LedgerTransaction | null>(null);

  React.useEffect(() => {
    if (initialAccountId !== null) setAccountFilterId(initialAccountId);
  }, [initialAccountId]);

  // Build filter object for the query — derived state, stable reference via useMemo
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

  // Flatten all pages into a single list
  const transactions = React.useMemo(
    () => txQuery.data?.pages.flat() ?? [],
    [txQuery.data],
  );

  // Group by date label for display
  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, LedgerTransaction[]>();
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

  // KPI totals from stored account balances — cheap O(accounts)
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
    (tx: LedgerTransaction) => {
      router.push(`/transactions/edit/${tx.id}`);
    },
    [router],
  );

  const handleDelete = React.useCallback(
    (tx: LedgerTransaction) => {
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
            {/* KPI card */}
            <View style={styles.kpiCard}>
              {kpiCurrencies.length > 1 && (
                <View style={styles.kpiTabsWrap}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
                    {kpiCurrencies.map((cur) => (
                      <TouchableOpacity
                        key={cur}
                        style={[styles.currencyTab, selectedKpiCurrency === cur && styles.currencyTabActive]}
                        onPress={() => setSelectedKpiCurrency(cur)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.currencyTabText, selectedKpiCurrency === cur && styles.currencyTabTextActive]}>{cur}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={styles.kpiStrip}>
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>IN</Text>
                  <MoneyText amount={activeTotals.income} currency={selectedKpiCurrency ?? undefined} type="CR" weight="bold" style={styles.kpiValue} />
                </View>
                <View style={styles.kpiSep} />
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>OUT</Text>
                  <MoneyText amount={activeTotals.expense} currency={selectedKpiCurrency ?? undefined} type="DR" weight="bold" style={styles.kpiValue} />
                </View>
                <View style={styles.kpiSep} />
                <View style={styles.kpiCell}>
                  <Text style={styles.kpiLabel}>NET</Text>
                  <MoneyText
                    amount={Math.abs(activeTotals.income - activeTotals.expense)}
                    currency={selectedKpiCurrency ?? undefined}
                    type={activeTotals.income >= activeTotals.expense ? 'CR' : 'DR'}
                    weight="bold"
                    style={styles.kpiValue}
                  />
                </View>
              </View>
            </View>

            {/* Active filter chips */}
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

      {/* FAB */}
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

    /* ── Header actions ── */
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

    /* ── Scroll content ── */
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

    /* ── KPI card + currency tabs ── */
    kpiCard: {
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    kpiTabsWrap: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
      paddingLeft: 12,
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 12,
    },
    currencyTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencyTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    currencyTabText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    currencyTabTextActive: {
      color: colors.background,
    },

    /* ── KPI strip ── */
    kpiStrip: {
      flexDirection: 'row',
    },
    kpiCell: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
      gap: 5,
    },
    kpiSep: {
      width: 1,
      marginVertical: 12,
      backgroundColor: colors.border,
    },
    kpiLabel: {
      color: colors.textMuted,
      fontFamily: typography.fonts.semibold,
      fontSize: 9,
      letterSpacing: 1.4,
    },
    kpiValue: {
      fontSize: 15,
      lineHeight: 18,
    },

    /* ── Active filter row ── */
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

    /* ── Day section ── */
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
      // backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },

    /* ── Transaction row ── */
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingRight: 14,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    txRowLast: {
      borderBottomWidth: 0,
    },
    txAccent: {
      width: 3,
      alignSelf: 'stretch',
      borderRadius: 999,
      marginLeft: 4,
      marginVertical: 6,
    },
    txIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txInfo: {
      flex: 1,
      gap: 3,
    },
    txTitle: {
      color: colors.text,
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },
    txMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    txCategoryDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    txMeta: {
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
    },
    txMetaDivider: {
      color: colors.textMuted,
      fontSize: 12,
    },
    txRight: {
      alignItems: 'flex-end',
      gap: 3,
    },
    txAmount: {
      fontSize: 14,
    },
    txTime: {
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
      fontSize: 11,
    },

    /* ── Empty state ── */
    emptyWrap: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: 10,
    },
    emptyIconBox: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: typography.fonts.heading,
      fontSize: 22,
      letterSpacing: -0.5,
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      textAlign: 'center',
      maxWidth: 260,
      lineHeight: 20,
    },
    emptyAction: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 44,
      paddingHorizontal: 20,
      borderRadius: 14,
      backgroundColor: colors.text,
    },
    emptyActionText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },

    /* ── FAB ── */
    fab: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },

    /* ── Filter sheet ── */
    sheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheetCard: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 36 : 28,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderColor: colors.border,
      maxHeight: '72%',
      gap: 14,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.textMuted + '44',
      marginBottom: 4,
    },
    sheetHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sheetTitle: {
      color: colors.text,
      fontFamily: typography.fonts.heading,
      fontSize: 26,
      letterSpacing: -0.6,
    },
    sheetClearBtn: {
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      justifyContent: 'center',
    },
    sheetClearBtnText: {
      color: colors.textMuted,
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
    },
    sheetLabel: {
      color: colors.textMuted,
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      letterSpacing: 1.3,
      marginBottom: 10,
    },
    sheetChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 36,
      borderRadius: 999,
      paddingHorizontal: 14,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    sheetChipActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    sheetChipDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    sheetChipText: {
      color: colors.text,
      fontFamily: typography.fonts.medium,
      fontSize: 13,
    },
    sheetChipTextActive: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
    },
    sheetApplyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.text,
      marginTop: 4,
    },
    sheetApplyBtnText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
    },
    sheetApplyBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetApplyBadgeText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
    },
  });
