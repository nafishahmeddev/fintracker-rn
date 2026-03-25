import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { LedgerTransaction } from '../../src/features/transactions/components/TransactionEditModal';
import { useDeleteTransaction, useTransactions } from '../../src/features/transactions/hooks/transactions';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type TransactionTypeFilter = 'ALL' | 'CR' | 'DR';

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
  const swipeRef = React.useRef<Swipeable>(null);
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
    () => (
      <View
        style={{
          flexDirection: 'row',
          width: 152,
          borderTopRightRadius: isFirst ? 18 : 0,
          borderBottomRightRadius: isLast ? 18 : 0,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          onPress={handleEdit}
          activeOpacity={0.85}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            backgroundColor: colors.primary,
          }}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.background} />
          <Text style={{ color: colors.background, fontFamily: typography.fonts.semibold, fontSize: 11 }}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.85}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            backgroundColor: colors.danger,
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: typography.fonts.semibold, fontSize: 11 }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [handleEdit, handleDelete, colors, isFirst, isLast],
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      friction={2}
      overshootRight={false}
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

  const transactionsQuery = useTransactions();
  const deleteTransaction = useDeleteTransaction();

  const transactions = React.useMemo(
    () => (transactionsQuery.data ?? []) as LedgerTransaction[],
    [transactionsQuery.data]
  );

  const [typeFilter, setTypeFilter] = React.useState<TransactionTypeFilter>('ALL');
  const [accountFilterId, setAccountFilterId] = React.useState<number | null>(null);
  const [categoryFilterId, setCategoryFilterId] = React.useState<number | null>(null);
  const [showFilterSheet, setShowFilterSheet] = React.useState(false);

  React.useEffect(() => {
    if (initialAccountId !== null) {
      setAccountFilterId(initialAccountId);
    }
  }, [initialAccountId]);

  const accountOptions = React.useMemo(() => {
    const map = new Map<number, LedgerTransaction['account']>();
    transactions.forEach((item) => {
      if (!map.has(item.account.id)) map.set(item.account.id, item.account);
    });
    return [...map.values()];
  }, [transactions]);

  const categoryOptions = React.useMemo(() => {
    const map = new Map<number, LedgerTransaction['category']>();
    transactions.forEach((item) => {
      if (!map.has(item.category.id)) map.set(item.category.id, item.category);
    });
    return [...map.values()];
  }, [transactions]);

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((item) => {
      if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
      if (accountFilterId !== null && item.account.id !== accountFilterId) return false;
      if (categoryFilterId !== null && item.category.id !== categoryFilterId) return false;
      return true;
    });
  }, [transactions, typeFilter, accountFilterId, categoryFilterId]);

  const totalsByCurrency = React.useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    filteredTransactions.forEach((item) => {
      const cur = item.account.currency;
      if (!map[cur]) map[cur] = { income: 0, expense: 0 };
      if (item.type === 'CR') map[cur].income += item.amount;
      if (item.type === 'DR') map[cur].expense += item.amount;
    });
    return map;
  }, [filteredTransactions]);

  const kpiCurrencies = React.useMemo(() => Object.keys(totalsByCurrency), [totalsByCurrency]);

  const [selectedKpiCurrency, setSelectedKpiCurrency] = React.useState<string | null>(null);

  // Keep selectedKpiCurrency in sync when filtered set changes
  React.useEffect(() => {
    if (kpiCurrencies.length === 0) {
      setSelectedKpiCurrency(null);
    } else if (!selectedKpiCurrency || !kpiCurrencies.includes(selectedKpiCurrency)) {
      setSelectedKpiCurrency(kpiCurrencies[0]);
    }
  }, [kpiCurrencies, selectedKpiCurrency]);

  const activeTotals = selectedKpiCurrency
    ? (totalsByCurrency[selectedKpiCurrency] ?? { income: 0, expense: 0 })
    : { income: 0, expense: 0 };

  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, LedgerTransaction[]>();
    filteredTransactions.forEach((item) => {
      const key = getDateLabel(item.datetime);
      const prev = map.get(key) ?? [];
      prev.push(item);
      map.set(key, prev);
    });
    return [...map.entries()];
  }, [filteredTransactions]);

  const activeFilterCount =
    (typeFilter !== 'ALL' ? 1 : 0) + (accountFilterId !== null ? 1 : 0) + (categoryFilterId !== null ? 1 : 0);

  const clearFilters = () => {
    setTypeFilter('ALL');
    setAccountFilterId(null);
    setCategoryFilterId(null);
  };

  const handleEdit = React.useCallback(
    (tx: LedgerTransaction) => {
      router.push({ pathname: '/add-transaction', params: { id: String(tx.id) } });
    },
    [router],
  );

  const handleDelete = React.useCallback(
    (tx: LedgerTransaction) => {
      Alert.alert(
        'Delete Transaction',
        'This will remove the transaction and reverse its account balance impact.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction.mutate(tx.id) },
        ],
      );
    },
    [deleteTransaction],
  );

  if (transactionsQuery.isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>{filteredTransactions.length} records</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowFilterSheet(true)} activeOpacity={0.9}>
          <Ionicons name="options-outline" size={18} color={colors.text} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Type segmented control */}
      <View style={styles.segmentedWrap}>
        {(['ALL', 'CR', 'DR'] as const).map((t) => {
          const active = typeFilter === t;
          const label = t === 'ALL' ? 'All' : t === 'CR' ? 'Income' : 'Expense';
          const icon: keyof typeof Ionicons.glyphMap =
            t === 'ALL' ? 'list-outline' : t === 'CR' ? 'arrow-down-outline' : 'arrow-up-outline';
          return (
            <TouchableOpacity
              key={t}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => setTypeFilter(t)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={icon}
                size={13}
                color={active ? colors.background : colors.textMuted}
              />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* KPI strip */}
        {kpiCurrencies.length > 1 && (
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

        {/* Grouped transaction list */}
        {groupedByDate.length === 0 ? (
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
            <TouchableOpacity style={styles.emptyAction} onPress={() => router.push('/add-transaction')}>
              <Text style={styles.emptyActionText}>Add Transaction</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.background} />
            </TouchableOpacity>
          </View>
        ) : (
          groupedByDate.map(([dateLabel, items]) => {
            const dayTotal = items.reduce(
              (acc, tx) => {
                if (tx.type === 'CR') acc.in += tx.amount;
                else acc.out += tx.amount;
                return acc;
              },
              { in: 0, out: 0 }
            );
            return (
              <View key={dateLabel} style={styles.daySection}>
                {/* Date header row */}
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

                {/* Rows */}
                <View style={styles.dayCard}>
                  {items.map((tx, idx) => {
                    return (
                      <SwipeableRow
                        key={tx.id}
                        tx={tx}
                        isFirst={idx === 0}
                        isLast={idx === items.length - 1}
                        colors={colors}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-transaction')} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>

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
              <Text style={styles.sheetLabel}>Account</Text>
              <View style={styles.sheetChipsWrap}>
                <TouchableOpacity
                  style={[styles.sheetChip, accountFilterId === null && styles.sheetChipActive]}
                  onPress={() => setAccountFilterId(null)}
                >
                  <Text style={[styles.sheetChipText, accountFilterId === null && styles.sheetChipTextActive]}>All</Text>
                </TouchableOpacity>
                {accountOptions.map((account) => {
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
                {categoryOptions.map((category) => {
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

    /* ── Header ── */
    header: {
      marginTop: 12,
      marginBottom: 12,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: { flex: 1 },
    headerTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 30,
      lineHeight: 32,
      color: colors.text,
      letterSpacing: -0.8,
    },
    headerSubtitle: {
      marginTop: 2,
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
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

    /* ── Segmented control ── */
    segmentedWrap: {
      flexDirection: 'row',
      marginHorizontal: 24,
      marginBottom: 16,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      gap: 4,
    },
    segment: {
      flex: 1,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    segmentActive: {
      backgroundColor: colors.text,
    },
    segmentText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.2,
    },
    segmentTextActive: {
      color: colors.background,
    },

    /* ── Scroll content ── */
    content: {
      paddingHorizontal: 24,
      paddingBottom: 120,
      gap: 16,
    },

    /* ── Currency tabs ── */
    currencyTabsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    currencyTab: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 100,
      backgroundColor: colors.surface,
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
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
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
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
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
