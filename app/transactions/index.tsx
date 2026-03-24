import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { useDeleteTransaction, useTransactions } from '../../src/features/transactions/hooks/transactions';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

type TransactionTypeFilter = 'ALL' | 'CR' | 'DR';

type LedgerTransaction = {
  id: number;
  accountId: number;
  categoryId: number;
  amount: number;
  type: 'CR' | 'DR';
  datetime: string;
  note: string;
  account: {
    id: number;
    name: string;
    currency: string;
    color: number;
  };
  category: {
    id: number;
    name: string;
    icon: string;
    color: number;
  };
};

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

export default function TransactionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string | string[] }>();
  const initialAccountId = React.useMemo(() => resolveParamNumber(params.accountId), [params.accountId]);

  const { colors, isDark } = useTheme();
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

  const totals = React.useMemo(() => {
    return filteredTransactions.reduce(
      (acc, item) => {
        if (item.type === 'CR') acc.income += item.amount;
        if (item.type === 'DR') acc.expense += item.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [filteredTransactions]);

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

  const handleDelete = (tx: LedgerTransaction) => {
    Alert.alert('Delete Transaction', 'This will remove the transaction and reverse its account balance impact.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTransaction.mutate(tx.id),
      },
    ]);
  };

  if (transactionsQuery.isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.bgCircle, { top: -60, left: -60, width: 300, height: 300, backgroundColor: colors.primary + '2A' }]} />
        <View style={[styles.bgCircle, { top: 220, right: -130, width: 430, height: 430, backgroundColor: colors.text + '12' }]} />
      </View>

      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 96}
        tint={isDark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFillObject}
      />
      {Platform.OS === 'android' ? (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]} pointerEvents="none" />
      ) : null}

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>Search and audit your ledger fast</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowFilterSheet(true)} activeOpacity={0.9}>
          <Ionicons name="options-outline" size={18} color={colors.text} />
          {activeFilterCount > 0 ? <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View> : null}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiPanel}>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>TOTAL IN</Text>
            <MoneyText amount={totals.income} type="CR" weight="bold" style={styles.kpiValue} />
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>TOTAL OUT</Text>
            <MoneyText amount={totals.expense} type="DR" weight="bold" style={styles.kpiValue} />
          </View>
        </View>

        {groupedByDate.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>Try changing filters or add a new transaction.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/add-transaction')}>
              <Text style={styles.emptyButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          groupedByDate.map(([dateLabel, items]) => (
            <View key={dateLabel} style={styles.daySection}>
              <Text style={styles.dayTitle}>{dateLabel}</Text>
              <View style={styles.dayList}>
                {items.map((tx) => {
                  const categoryColor = toHexColor(tx.category.color);
                  return (
                    <TouchableOpacity
                      key={tx.id}
                      style={styles.txRow}
                      activeOpacity={0.9}
                      onLongPress={() => handleDelete(tx)}
                      delayLongPress={220}
                    >
                      <View style={styles.txLeft}>
                        <View style={[styles.txIconWrap, { backgroundColor: categoryColor + '22' }]}>
                          <Ionicons
                            name={(tx.category.icon as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                            size={18}
                            color={categoryColor}
                          />
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={styles.txTitle} numberOfLines={1}>{tx.note || tx.category.name}</Text>
                          <Text style={styles.txMeta} numberOfLines={1}>{tx.category.name} • {tx.account.name}</Text>
                        </View>
                      </View>
                      <View style={styles.txRight}>
                        <MoneyText
                          amount={tx.amount}
                          currency={tx.account.currency}
                          type={tx.type}
                          weight="bold"
                          style={styles.txAmount}
                        />
                        <Text style={styles.txTime}>{new Date(tx.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-transaction')} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>

      <Modal visible={showFilterSheet} transparent animationType="fade" onRequestClose={() => setShowFilterSheet(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setShowFilterSheet(false)} />
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Filters</Text>

            <Text style={styles.sheetLabel}>Type</Text>
            <View style={styles.sheetChipsWrap}>
              {(['ALL', 'CR', 'DR'] as const).map((typeOption) => {
                const selected = typeFilter === typeOption;
                const label = typeOption === 'ALL' ? 'All' : typeOption === 'CR' ? 'Income' : 'Expense';
                return (
                  <TouchableOpacity
                    key={typeOption}
                    style={[styles.sheetChip, selected && styles.sheetChipActive]}
                    onPress={() => setTypeFilter(typeOption)}
                  >
                    <Text style={[styles.sheetChipText, selected && styles.sheetChipTextActive]}>{label}</Text>
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
                <Text style={[styles.sheetChipText, accountFilterId === null && styles.sheetChipTextActive]}>All Accounts</Text>
              </TouchableOpacity>
              {accountOptions.map((account) => {
                const selected = accountFilterId === account.id;
                return (
                  <TouchableOpacity
                    key={account.id}
                    style={[styles.sheetChip, selected && styles.sheetChipActive]}
                    onPress={() => setAccountFilterId(account.id)}
                  >
                    <Text style={[styles.sheetChipText, selected && styles.sheetChipTextActive]}>{account.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sheetLabel}>Category</Text>
            <View style={styles.sheetChipsWrap}>
              <TouchableOpacity
                style={[styles.sheetChip, categoryFilterId === null && styles.sheetChipActive]}
                onPress={() => setCategoryFilterId(null)}
              >
                <Text style={[styles.sheetChipText, categoryFilterId === null && styles.sheetChipTextActive]}>All Categories</Text>
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

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetSecondaryBtn} onPress={clearFilters}>
                <Text style={styles.sheetSecondaryBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetPrimaryBtn} onPress={() => setShowFilterSheet(false)}>
                <Text style={styles.sheetPrimaryBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
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
    bgCircle: {
      position: 'absolute',
      borderRadius: 999,
    },
    loadingWrap: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      marginTop: 8,
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
      overflow: 'hidden',
    },
    headerCopy: {
      flex: 1,
    },
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
      top: 6,
      right: 6,
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
      fontSize: 10,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 120,
      gap: 16,
    },
    kpiPanel: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      flexDirection: 'row',
      alignItems: 'stretch',
      overflow: 'hidden',
    },
    kpiCol: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 6,
    },
    kpiDivider: {
      width: 1,
      backgroundColor: colors.border,
    },
    kpiLabel: {
      color: colors.textMuted,
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      letterSpacing: 1.2,
    },
    kpiValue: {
      fontSize: 18,
      lineHeight: 20,
    },
    daySection: {
      gap: 8,
    },
    dayTitle: {
      color: colors.textMuted,
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      letterSpacing: 1.15,
      textTransform: 'uppercase',
      paddingHorizontal: 2,
      marginTop: 8,
    },
    dayList: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    txRow: {
      minHeight: 72,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    txLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      paddingRight: 10,
    },
    txIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txInfo: {
      flex: 1,
      gap: 2,
    },
    txTitle: {
      color: colors.text,
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },
    txMeta: {
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
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
    emptyCard: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 8,
      marginTop: 6,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: typography.fonts.semibold,
      fontSize: 16,
    },
    emptySubtitle: {
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
      fontSize: 13,
    },
    emptyButton: {
      marginTop: 4,
      alignSelf: 'flex-start',
      height: 34,
      borderRadius: 999,
      paddingHorizontal: 12,
      justifyContent: 'center',
      backgroundColor: colors.text,
    },
    emptyButtonText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    sheetCard: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 28,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderColor: colors.border,
      gap: 12,
      maxHeight: '78%',
    },
    sheetTitle: {
      color: colors.text,
      fontFamily: typography.fonts.heading,
      fontSize: 24,
      letterSpacing: -0.5,
    },
    sheetLabel: {
      color: colors.textMuted,
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      letterSpacing: 1,
      marginTop: 2,
    },
    sheetChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      minHeight: 34,
      borderRadius: 999,
      paddingHorizontal: 12,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    sheetChipActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
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
    sheetActions: {
      marginTop: 8,
      flexDirection: 'row',
      gap: 10,
    },
    sheetSecondaryBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetSecondaryBtnText: {
      color: colors.text,
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },
    sheetPrimaryBtn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      backgroundColor: colors.text,
      borderWidth: 1,
      borderColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetPrimaryBtnText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },
  });
