import { usePremium } from '@/src/providers/PremiumProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { Header } from '../../src/components/ui/Header';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { PremiumGuard } from '../../src/components/ui/PremiumGuard';
import { DEFAULT_CURRENCY } from '../../src/constants/currency';
import { useAccounts } from '../../src/features/accounts/hooks/accounts';
import { useTransactions } from '../../src/features/transactions/hooks/transactions';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { TYPOGRAPHY } from '../../src/theme/typography';

const RANGE_OPTIONS = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: 'ALL', value: null },
] as const;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

type IoniconName = keyof typeof Ionicons.glyphMap;

const resolveIconName = (raw: string | null | undefined, fallback: IoniconName): IoniconName => {
  if (raw && raw in Ionicons.glyphMap) return raw as IoniconName;
  if (raw) {
    const outlined = `${raw}-outline`;
    if (outlined in Ionicons.glyphMap) return outlined as IoniconName;
  }
  return fallback;
};

const computeFlow = (items: { type: 'CR' | 'DR'; amount: number }[]) =>
  items.reduce(
    (accumulator, transaction) => {
      if (transaction.type === 'CR') accumulator.income += transaction.amount;
      else accumulator.expense += transaction.amount;
      return accumulator;
    },
    { income: 0, expense: 0 },
  );

export default function StatsScreen() {
  const { colors } = useTheme();
  const { isPremium } = usePremium();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const currencyKeys = React.useMemo(() => {
    const keys = Array.from(new Set((accounts ?? []).map((account) => account.currency)));
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [accounts]);

  const [selectedCurrency, setSelectedCurrency] = React.useState(currencyKeys[0]);
  const [selectedRange, setSelectedRange] = React.useState<(typeof RANGE_OPTIONS)[number]['value']>(7);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  const cutoffDate = React.useMemo(() => {
    if (selectedRange === null) return null;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (selectedRange - 1));
    return date;
  }, [selectedRange]);

  const filteredTransactions = React.useMemo(() => {
    return (transactions ?? []).filter((transaction) => {
      if (transaction.account.currency !== selectedCurrency) return false;
      if (!cutoffDate) return true;
      return new Date(transaction.datetime) >= cutoffDate;
    });
  }, [transactions, selectedCurrency, cutoffDate]);

  const currencyAccounts = React.useMemo(() => {
    return (accounts ?? []).filter((account) => account.currency === selectedCurrency);
  }, [accounts, selectedCurrency]);

  const summary = React.useMemo(() => {
    const totals = computeFlow(filteredTransactions as { type: 'CR' | 'DR'; amount: number }[]);

    const balance = currencyAccounts.reduce((sum, account) => sum + account.balance, 0);
    const avgExpense = filteredTransactions.filter((transaction) => transaction.type === 'DR').length > 0
      ? totals.expense / filteredTransactions.filter((transaction) => transaction.type === 'DR').length
      : 0;

    return {
      ...totals,
      balance,
      net: totals.income - totals.expense,
      count: filteredTransactions.length,
      avgExpense,
    };
  }, [filteredTransactions, currencyAccounts]);

  const previousWindowTransactions = React.useMemo(() => {
    if (selectedRange === null || !cutoffDate) return [];

    const previousStart = new Date(cutoffDate);
    previousStart.setDate(previousStart.getDate() - selectedRange);

    return (transactions ?? []).filter((transaction) => {
      if (transaction.account.currency !== selectedCurrency) return false;
      const txDate = new Date(transaction.datetime);
      return txDate >= previousStart && txDate < cutoffDate;
    });
  }, [transactions, selectedCurrency, selectedRange, cutoffDate]);

  const previousSummary = React.useMemo(() => {
    const totals = computeFlow(previousWindowTransactions as { type: 'CR' | 'DR'; amount: number }[]);
    return {
      ...totals,
      net: totals.income - totals.expense,
    };
  }, [previousWindowTransactions]);

  const practicalMetrics = React.useMemo(() => {
    const expenseCount = filteredTransactions.filter((transaction) => transaction.type === 'DR').length;
    const coveredDays = selectedRange ?? Math.max(1, Math.ceil((Date.now() - new Date(filteredTransactions.at(-1)?.datetime ?? Date.now()).getTime()) / 86400000));
    const dailyBurn = coveredDays > 0 ? summary.expense / coveredDays : 0;
    const runwayDays = dailyBurn > 0 ? summary.balance / dailyBurn : null;
    const savingsRate = summary.income > 0 ? summary.net / summary.income : 0;
    const flowRatio = summary.expense > 0 ? summary.income / summary.expense : null;
    const largestExpense = filteredTransactions
      .filter((transaction) => transaction.type === 'DR')
      .sort((a, b) => b.amount - a.amount)[0] ?? null;

    return {
      coveredDays,
      dailyBurn,
      runwayDays,
      savingsRate,
      flowRatio,
      expenseCount,
      largestExpense,
    };
  }, [filteredTransactions, selectedRange, summary]);

  const topCategories = React.useMemo(() => {
    const categoryMap = new Map<number, {
      id: number;
      name: string;
      icon: string | null;
      color: string;
      amount: number;
      count: number;
    }>();

    filteredTransactions
      .filter((transaction) => transaction.type === 'DR')
      .forEach((transaction) => {
        const current = categoryMap.get(transaction.category.id);
        const color = transaction.category.color
          ? `#${transaction.category.color.toString(16).padStart(6, '0')}`
          : colors.primary;

        if (current) {
          current.amount += transaction.amount;
          current.count += 1;
        } else {
          categoryMap.set(transaction.category.id, {
            id: transaction.category.id,
            name: transaction.category.name,
            icon: transaction.category.icon,
            color,
            amount: transaction.amount,
            count: 1,
          });
        }
      });

    return Array.from(categoryMap.values())
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);
  }, [filteredTransactions, colors.primary]);

  const accountBreakdown = React.useMemo(() => {
    const total = currencyAccounts.reduce((sum, account) => sum + Math.max(account.balance, 0), 0);
    return currencyAccounts
      .map((account) => ({
        ...account,
        colorHex: `#${account.color.toString(16).padStart(6, '0')}`,
        share: total > 0 ? Math.max(account.balance, 0) / total : 0,
      }))
      .sort((left, right) => right.balance - left.balance)
      .slice(0, 5);
  }, [currencyAccounts]);

  const trendDays = React.useMemo(() => {
    const buckets = new Map<string, { date: Date; income: number; expense: number }>();
    const today = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      buckets.set(key, { date, income: 0, expense: 0 });
    }

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.datetime);
      date.setHours(0, 0, 0, 0);
      const key = date.toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (!bucket) return;
      if (transaction.type === 'CR') bucket.income += transaction.amount;
      else bucket.expense += transaction.amount;
    });

    return Array.from(buckets.values());
  }, [filteredTransactions]);

  const trendMax = React.useMemo(() => {
    return Math.max(1, ...trendDays.flatMap((day) => [day.income, day.expense]));
  }, [trendDays]);

  const latestTransactions = React.useMemo(() => filteredTransactions.slice(0, 5), [filteredTransactions]);

  const comparison = React.useMemo(() => {
    if (selectedRange === null) return null;
    const deltaIncome = summary.income - previousSummary.income;
    const deltaExpense = summary.expense - previousSummary.expense;
    const deltaNet = summary.net - previousSummary.net;
    return { deltaIncome, deltaExpense, deltaNet };
  }, [selectedRange, summary, previousSummary]);

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <Header title="Stats" subtitle="Your financial insights" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.controlCard}>
          <Text style={styles.cardLabel}>CURRENCY</Text>
          <View style={styles.segmentRow}>
            {currencyKeys.map((currency) => {
              const active = currency === selectedCurrency;
              return (
                <TouchableOpacity
                  key={currency}
                  style={[styles.segmentPill, active && styles.segmentPillActive]}
                  onPress={() => setSelectedCurrency(currency)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{currency}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.cardLabel, { marginTop: 12 }]}>WINDOW</Text>
          <View style={styles.segmentRow}>
            {RANGE_OPTIONS.map((option) => {
              const active = option.value === selectedRange;
              const isLocked = !isPremium && option.value !== 7;

              return (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.segmentPill,
                    active && styles.segmentPillActive,
                    isLocked && styles.segmentPillLocked
                  ]}
                  onPress={() => {
                    if (isLocked) {
                      router.push('/premium');
                    } else {
                      setSelectedRange(option.value);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
                  {isLocked && <Ionicons name="lock-closed" size={10} color={colors.textMuted} style={styles.lockIcon} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.snapshotCard}>
          <View style={styles.snapshotTopRow}>
            <View>
              <Text style={styles.snapshotKicker}>NET POSITION</Text>
              <MoneyText amount={Math.abs(summary.net)} currency={selectedCurrency} type={summary.net >= 0 ? 'CR' : 'DR'} style={styles.snapshotAmount} weight="bold" />
            </View>
            <View style={styles.rangeBadge}>
              <Text style={styles.rangeBadgeText}>{selectedRange === null ? 'ALL TIME' : `${selectedRange} DAYS`}</Text>
            </View>
          </View>

          <View style={styles.snapshotGrid}>
            <View style={styles.snapshotCell}>
              <Text style={styles.snapshotLabel}>INCOME</Text>
              <MoneyText amount={summary.income} currency={selectedCurrency} type="CR" style={styles.snapshotValue} weight="bold" />
            </View>
            <View style={styles.snapshotCell}>
              <Text style={styles.snapshotLabel}>EXPENSE</Text>
              <MoneyText amount={summary.expense} currency={selectedCurrency} type="DR" style={styles.snapshotValue} weight="bold" />
            </View>
            <View style={styles.snapshotCell}>
              <Text style={styles.snapshotLabel}>BALANCE</Text>
              <MoneyText amount={summary.balance} currency={selectedCurrency} style={styles.snapshotValue} weight="bold" />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PRACTICAL INSIGHTS</Text>
          <Text style={styles.sectionHint}>{selectedCurrency}</Text>
        </View>
        <PremiumGuard label="INSIGHTS PRO">
          <View style={styles.sectionCard}>
            <View style={styles.metricGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>AVG DAILY BURN</Text>
                <MoneyText amount={practicalMetrics.dailyBurn} currency={selectedCurrency} type="DR" style={styles.metricValue} weight="bold" />
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>SAVINGS RATE</Text>
                <Text style={styles.metricPlainValue}>{`${(practicalMetrics.savingsRate * 100).toFixed(1)}%`}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>RUNWAY</Text>
                <Text style={styles.metricPlainValue}>{practicalMetrics.runwayDays === null ? 'No burn' : `${Math.max(0, practicalMetrics.runwayDays).toFixed(0)} days`}</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>IN/OUT RATIO</Text>
                <Text style={styles.metricPlainValue}>{practicalMetrics.flowRatio === null ? 'N/A' : `${practicalMetrics.flowRatio.toFixed(2)}x`}</Text>
              </View>
            </View>
          </View>
        </PremiumGuard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PERIOD DELTA</Text>
          <Text style={styles.sectionHint}>{selectedRange === null ? 'Unavailable for ALL' : `vs previous ${selectedRange}D`}</Text>
        </View>
        <PremiumGuard label="COMPARISON PRO" containerStyle={{ marginBottom: 22 }}>
          <View style={styles.sectionCard}>
            {comparison ? (
              <View style={styles.deltaList}>
                <View style={styles.deltaRow}>
                  <View style={styles.deltaMeta}>
                    <Ionicons name={comparison.deltaIncome >= 0 ? 'arrow-up' : 'arrow-down'} size={14} color={comparison.deltaIncome >= 0 ? colors.success : colors.danger} />
                    <Text style={styles.deltaLabel}>INCOME</Text>
                  </View>
                  <MoneyText
                    amount={Math.abs(comparison.deltaIncome)}
                    currency={selectedCurrency}
                    type={comparison.deltaIncome >= 0 ? 'CR' : 'DR'}
                    style={styles.deltaValue}
                    weight="bold"
                  />
                </View>

                <View style={styles.deltaRow}>
                  <View style={styles.deltaMeta}>
                    <Ionicons name={comparison.deltaExpense <= 0 ? 'arrow-down' : 'arrow-up'} size={14} color={comparison.deltaExpense <= 0 ? colors.success : colors.danger} />
                    <Text style={styles.deltaLabel}>EXPENSE</Text>
                  </View>
                  <MoneyText
                    amount={Math.abs(comparison.deltaExpense)}
                    currency={selectedCurrency}
                    type={comparison.deltaExpense <= 0 ? 'CR' : 'DR'}
                    style={styles.deltaValue}
                    weight="bold"
                  />
                </View>

                <View style={styles.deltaRow}>
                  <View style={styles.deltaMeta}>
                    <Ionicons name={comparison.deltaNet >= 0 ? 'trending-up' : 'trending-down'} size={14} color={comparison.deltaNet >= 0 ? colors.success : colors.danger} />
                    <Text style={styles.deltaLabel}>NET</Text>
                  </View>
                  <MoneyText
                    amount={Math.abs(comparison.deltaNet)}
                    currency={selectedCurrency}
                    type={comparison.deltaNet >= 0 ? 'CR' : 'DR'}
                    style={styles.deltaValue}
                    weight="bold"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.emptyStateCompact}>
                <Text style={styles.emptyText}>Comparison requires a fixed date range.</Text>
              </View>
            )}
          </View>
        </PremiumGuard>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>7-DAY FLOW</Text>
          <Text style={styles.sectionHint}>Income vs expense</Text>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendText}>Expense</Text>
            </View>
          </View>
          {trendDays.map((day) => (
            <View key={day.date.toISOString()} style={styles.trendRow}>
              <View style={styles.trendDayWrap}>
                <Text style={styles.trendDay}>{WEEKDAY_FORMATTER.format(day.date)}</Text>
                <Text style={styles.trendDate}>{DAY_FORMATTER.format(day.date)}</Text>
              </View>
              <View style={styles.trendBars}>
                <View style={styles.trendBarTrack}>
                  <View style={[styles.trendBarFill, styles.trendIncomeFill, { width: `${(day.income / trendMax) * 100}%` }]} />
                </View>
                <View style={styles.trendBarTrack}>
                  <View style={[styles.trendBarFill, styles.trendExpenseFill, { width: `${(day.expense / trendMax) * 100}%` }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOP SPEND CATEGORIES</Text>
          <Text style={styles.sectionHint}>{topCategories.length} groups</Text>
        </View>
        <View style={styles.sectionCard}>
          {topCategories.length > 0 ? topCategories.map((category, index) => {
            const width = summary.expense > 0 ? (category.amount / summary.expense) * 100 : 0;
            return (
              <View key={category.id} style={[styles.listRow, index === topCategories.length - 1 && styles.listRowLast]}>
                <View style={[styles.listIcon, { backgroundColor: category.color + '18' }]}>
                  <Ionicons name={(category.icon as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'} size={16} color={category.color} />
                </View>
                <View style={styles.listBody}>
                  <View style={styles.listTopLine}>
                    <Text style={styles.listTitle}>{category.name}</Text>
                    <MoneyText amount={category.amount} currency={selectedCurrency} type="DR" style={styles.listAmount} weight="bold" />
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${width}%`, backgroundColor: category.color }]} />
                  </View>
                  <Text style={styles.listMeta}>{category.count} transactions</Text>
                </View>
              </View>
            );
          }) : (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={26} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No spending data</Text>
              <Text style={styles.emptyText}>Add expense transactions in {selectedCurrency} to populate this section.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACCOUNT SPLIT</Text>
          <Text style={styles.sectionHint}>{currencyAccounts.length} accounts</Text>
        </View>
        <View style={styles.sectionCard}>
          {accountBreakdown.length > 0 ? accountBreakdown.map((account, index) => (
            <View key={account.id} style={[styles.listRow, index === accountBreakdown.length - 1 && styles.listRowLast]}>
              <View style={[styles.listIcon, { backgroundColor: account.colorHex + '18' }]}>
                <Ionicons name={(account.icon as keyof typeof Ionicons.glyphMap) || 'wallet-outline'} size={16} color={account.colorHex} />
              </View>
              <View style={styles.listBody}>
                <View style={styles.listTopLine}>
                  <Text style={styles.listTitle}>{account.name}</Text>
                  <MoneyText amount={account.balance} currency={selectedCurrency} style={styles.listAmount} weight="bold" />
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${account.share * 100}%`, backgroundColor: account.colorHex }]} />
                </View>
                <Text style={styles.listMeta}>{Math.round(account.share * 100)}% of tracked balance</Text>
              </View>
            </View>
          )) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={26} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No accounts in this currency</Text>
              <Text style={styles.emptyText}>Create an account in {selectedCurrency} to view allocation stats.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
          <Text style={styles.sectionHint}>{summary.count} items</Text>
        </View>
        <View style={styles.sectionCard}>
          {latestTransactions.length > 0 ? latestTransactions.map((transaction, index) => {
            const accentColor = transaction.category.color
              ? `#${transaction.category.color.toString(16).padStart(6, '0')}`
              : colors.primary;
            return (
              <View key={transaction.id} style={[styles.txRow, index === latestTransactions.length - 1 && styles.listRowLast]}>
                <View style={[styles.txAccent, { backgroundColor: transaction.type === 'CR' ? colors.success : colors.danger }]} />
                <View style={[styles.listIcon, { backgroundColor: accentColor + '18' }]}>
                  <Ionicons name={(transaction.category.icon as keyof typeof Ionicons.glyphMap) || 'swap-horizontal-outline'} size={16} color={accentColor} />
                </View>
                <View style={styles.listBody}>
                  <View style={styles.listTopLine}>
                    <Text style={styles.listTitle}>{transaction.note || transaction.category.name}</Text>
                    <MoneyText amount={transaction.amount} currency={selectedCurrency} type={transaction.type} style={styles.listAmount} weight="bold" />
                  </View>
                  <Text style={styles.listMeta}>{transaction.account.name} · {DAY_FORMATTER.format(new Date(transaction.datetime))}</Text>
                </View>
              </View>
            );
          }) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={26} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No transactions in range</Text>
              <Text style={styles.emptyText}>Try switching the currency or widening the time range.</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LARGEST EXPENSE</Text>
          <Text style={styles.sectionHint}>{practicalMetrics.expenseCount} expense entries</Text>
        </View>
        <View style={styles.sectionCard}>
          {practicalMetrics.largestExpense ? (
            <View style={styles.highlightRow}>
              <View style={[styles.listIcon, { backgroundColor: colors.danger + '1A' }]}>
                <Ionicons
                  name={resolveIconName(practicalMetrics.largestExpense.category.icon, 'pricetag-outline')}
                  size={16}
                  color={colors.danger}
                />
              </View>
              <View style={styles.listBody}>
                <View style={styles.listTopLine}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {practicalMetrics.largestExpense.note || practicalMetrics.largestExpense.category.name}
                  </Text>
                  <MoneyText
                    amount={practicalMetrics.largestExpense.amount}
                    currency={selectedCurrency}
                    type="DR"
                    style={styles.listAmount}
                    weight="bold"
                  />
                </View>
                <Text style={styles.listMeta}>
                  {practicalMetrics.largestExpense.account.name} · {DATE_TIME_FORMATTER.format(new Date(practicalMetrics.largestExpense.datetime))}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateCompact}>
              <Text style={styles.emptyText}>No expense transactions in the selected range.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonGhost: {
    width: 44,
  },
  headerCopy: {
    flex: 1,
    paddingHorizontal: 14,
  },
  headerKicker: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fonts.headingRegular,
    color: colors.text,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.9,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 46,
  },
  controlCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  snapshotCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  snapshotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  snapshotKicker: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  snapshotAmount: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
  },
  rangeBadge: {
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.background + 'B3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeBadgeText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  cardLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentPill: {
    minWidth: 52,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.background + '80',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  segmentPillActive: {
    backgroundColor: colors.text,
  },
  segmentPillLocked: {
    opacity: 0.6,
  },
  segmentText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  segmentTextActive: {
    color: colors.background,
  },
  lockIcon: {
    marginLeft: 2,
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  snapshotCell: {
    flex: 1,
    minHeight: 78,
    borderRadius: 14,
    backgroundColor: colors.background + '80',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    justifyContent: 'space-between',
  },
  snapshotLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1,
  },
  snapshotValue: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.text,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  sectionHint: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 11,
  },
  sectionCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCell: {
    width: '47%',
    minHeight: 74,
    borderRadius: 14,
    backgroundColor: colors.background + '80',
    borderWidth: 1,
    borderColor: colors.background + '40',
    padding: 10,
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1,
  },
  metricValue: {
    fontSize: 13,
  },
  metricPlainValue: {
    fontFamily: TYPOGRAPHY.fonts.amountBold,
    color: colors.text,
    fontSize: 14,
  },
  deltaList: {
    gap: 10,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background + '80',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  deltaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  deltaLabel: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  deltaValue: {
    fontSize: 13,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
  },
  legendText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  trendDayWrap: {
    width: 40,
  },
  trendDay: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.text,
    fontSize: 11,
  },
  trendDate: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 9,
  },
  trendBars: {
    flex: 1,
    gap: 4,
  },
  trendBarTrack: {
    height: 6,
    backgroundColor: colors.background + '80',
    borderRadius: 3,
    overflow: 'hidden',
  },
  trendBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendIncomeFill: {
    backgroundColor: colors.success,
  },
  trendExpenseFill: {
    backgroundColor: colors.danger,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background + '40',
    gap: 12,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listBody: {
    flex: 1,
  },
  listTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.text,
    fontSize: 14,
  },
  listAmount: {
    fontSize: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.background + '80',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  listMeta: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 11,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background + '40',
    gap: 12,
    position: 'relative',
  },
  txAccent: {
    position: 'absolute',
    left: -14,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 2,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateCompact: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    color: colors.text,
    fontSize: 15,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
});