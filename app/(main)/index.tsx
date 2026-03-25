import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { DEFAULT_CURRENCY } from '../../src/constants/currency';
import { AccountFormModal } from '../../src/features/accounts/components/AccountFormModal';
import { useAccounts, useDeleteAccount } from '../../src/features/accounts/hooks/accounts';
import { useTransactions } from '../../src/features/transactions/hooks/transactions';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { profile } = useSettings();
  const { width: screenWidth } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(colors, screenWidth), [colors, screenWidth]);
  const router = useRouter();

  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [showAccountForm, setShowAccountForm] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<any>(undefined);

  const balancesByCurrency = React.useMemo(() => {
    return accounts?.reduce((acc, account) => {
      acc[account.currency] = (acc[account.currency] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>) || {};
  }, [accounts]);

  const currencyKeys = React.useMemo(() => {
    const keys = Object.keys(balancesByCurrency);
    return keys.length > 0 ? keys : [DEFAULT_CURRENCY];
  }, [balancesByCurrency]);

  const [selectedCurrency, setSelectedCurrency] = React.useState<string>(currencyKeys[0]);

  React.useEffect(() => {
    if (!currencyKeys.includes(selectedCurrency)) {
      setSelectedCurrency(currencyKeys[0]);
    }
  }, [currencyKeys, selectedCurrency]);

  // Totals for selected currency
  const totals = React.useMemo(() => {
    const relevant = (transactions ?? []).filter(tx => {
      const acc = accounts?.find(a => a.id === tx.accountId);
      return acc?.currency === selectedCurrency;
    });
    return relevant.reduce(
      (acc, tx) => {
        if (tx.type === 'CR') acc.income += tx.amount;
        else acc.expense += tx.amount;
        return acc;
      },
      { income: 0, expense: 0 }
    );
  }, [transactions, accounts, selectedCurrency]);

  const accountFlowById = React.useMemo(() => {
    const flowMap: Record<number, { income: number; expense: number }> = {};
    (transactions ?? []).forEach((tx) => {
      if (!flowMap[tx.accountId]) {
        flowMap[tx.accountId] = { income: 0, expense: 0 };
      }
      if (tx.type === 'CR') flowMap[tx.accountId].income += tx.amount;
      if (tx.type === 'DR') flowMap[tx.accountId].expense += tx.amount;
    });
    return flowMap;
  }, [transactions]);

  const topExpenseCategoriesByCurrency = React.useMemo(() => {
    const accountCurrencyMap = new Map<number, string>();
    (accounts ?? []).forEach((acc) => accountCurrencyMap.set(acc.id, acc.currency));

    const spendByCurrencyAndCategory = new Map<string, Map<number, { name: string; icon: string; color: number; amount: number }>>();

    (transactions ?? []).forEach((tx) => {
      if (tx.type !== 'DR') return;
      const currency = accountCurrencyMap.get(tx.accountId);
      if (!currency) return;

      if (!spendByCurrencyAndCategory.has(currency)) {
        spendByCurrencyAndCategory.set(currency, new Map());
      }

      const spendByCategory = spendByCurrencyAndCategory.get(currency)!;

      const prev = spendByCategory.get(tx.category.id);
      if (prev) {
        prev.amount += tx.amount;
        return;
      }

      spendByCategory.set(tx.category.id, {
        name: tx.category.name,
        icon: tx.category.icon || 'pricetag-outline',
        color: tx.category.color,
        amount: tx.amount,
      });
    });

    const rankedByCurrency: Record<string, { name: string; icon: string; color: number; amount: number }[]> = {};
    for (const [currency, spendByCategory] of spendByCurrencyAndCategory.entries()) {
      rankedByCurrency[currency] = [...spendByCategory.values()]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
    }

    return rankedByCurrency;
  }, [transactions, accounts]);

  const topCategoryCurrencies = React.useMemo(() => Object.keys(topExpenseCategoriesByCurrency), [topExpenseCategoriesByCurrency]);
  const [selectedTopCategoryCurrency, setSelectedTopCategoryCurrency] = React.useState<string>(selectedCurrency);

  React.useEffect(() => {
    if (topCategoryCurrencies.length === 0) {
      setSelectedTopCategoryCurrency(selectedCurrency);
      return;
    }
    if (topCategoryCurrencies.includes(selectedCurrency)) {
      setSelectedTopCategoryCurrency(selectedCurrency);
      return;
    }
    if (!topCategoryCurrencies.includes(selectedTopCategoryCurrency)) {
      setSelectedTopCategoryCurrency(topCategoryCurrencies[0]);
    }
  }, [topCategoryCurrencies, selectedCurrency, selectedTopCategoryCurrency]);

  const topExpenseCategories = topExpenseCategoriesByCurrency[selectedTopCategoryCurrency] ?? [];

  const handleAccountLongPress = (acc: any) => {
    Alert.alert('Manage Account', acc.name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => { setEditingAccount(acc); setShowAccountForm(true); } },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Confirm Delete', `Delete ${acc.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteAccount(acc.id) },
          ]);
        },
      },
    ]);
  };

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const incomeBarRatio = totals.income + totals.expense > 0
    ? totals.income / (totals.income + totals.expense)
    : 0.5;

  return (
    <SafeAreaView style={styles.container}>
      {/* Static background circles */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.bgCircle, { top: -60, left: -60, width: 340, height: 340, backgroundColor: colors.primary, opacity: 0.72 }]} />
        <View style={[styles.bgCircle, { top: 180, right: -110, width: 440, height: 440, backgroundColor: colors.primaryDark, opacity: 0.52 }]} />
        <View style={[styles.bgCircle, { bottom: -110, left: 40, width: 380, height: 380, backgroundColor: colors.primary, opacity: 0.6 }]} />
      </View>
      <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 95} blurType={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      {Platform.OS === 'android' && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]} pointerEvents="none" />
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}</Text>
            <Text style={styles.brandName}>FINTRACKER.</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/(main)/stats')} activeOpacity={0.85}>
              <Ionicons name="stats-chart-outline" size={18} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')} activeOpacity={0.85}>
              <Ionicons name="settings-outline" size={19} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero balance card ── */}
        <View style={styles.heroCard}>
          {/* Currency switcher tabs */}
          {currencyKeys.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
              {currencyKeys.map(curr => (
                <TouchableOpacity
                  key={curr}
                  style={[styles.currencyTab, selectedCurrency === curr && styles.currencyTabActive]}
                  onPress={() => setSelectedCurrency(curr)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.currencyTabText, selectedCurrency === curr && styles.currencyTabTextActive]}>{curr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={styles.heroBadge}>TOTAL BALANCE</Text>
          <MoneyText
            amount={balancesByCurrency[selectedCurrency] || 0}
            currency={selectedCurrency}
            style={styles.heroBalance}
            weight="bold"
          />

          {/* Income / Expense split bar */}
          <View style={styles.splitRow}>
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.success }]} />
              <Text style={styles.splitLabel}>IN</Text>
              <MoneyText amount={totals.income} currency={selectedCurrency} type="CR" weight="bold" style={styles.splitValue} />
            </View>
            <View style={styles.splitDivider} />
            <View style={styles.splitItem}>
              <View style={[styles.splitDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.splitLabel}>OUT</Text>
              <MoneyText amount={totals.expense} currency={selectedCurrency} type="DR" weight="bold" style={styles.splitValue} />
            </View>
          </View>

          {/* Visual bar */}
          <View style={styles.flowBar}>
            <View style={[styles.flowBarIncome, { flex: incomeBarRatio }]} />
            <View style={[styles.flowBarExpense, { flex: 1 - incomeBarRatio }]} />
          </View>
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionPrimary} onPress={() => router.push('/add-transaction')} activeOpacity={0.85}>
            <Ionicons name="add" size={20} color={colors.background} />
            <Text style={styles.quickActionPrimaryText}>Add Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionSecondary} onPress={() => router.push('/transactions')} activeOpacity={0.85}>
            <Ionicons name="list-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionSecondaryText}>All Transactions</Text>
          </TouchableOpacity>
        </View>

        {/* ── Accounts section ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>ACCOUNTS</Text>
          <TouchableOpacity
            style={styles.sectionAction}
            onPress={() => { setEditingAccount(undefined); setShowAccountForm(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={14} color={colors.primary} />
            <Text style={styles.sectionActionText}>New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsScroll}
          contentContainerStyle={styles.accountsScrollContent}
        >
          {accounts?.map(acc => {
            const accColor = '#' + acc.color.toString(16).padStart(6, '0');
            const cardFlow = accountFlowById[acc.id] ?? { income: 0, expense: 0 };
            const openingBalanceEstimate = acc.balance - (acc.income - acc.expense);
            const cardAvailable = openingBalanceEstimate + (cardFlow.income - cardFlow.expense);
            return (
              <TouchableOpacity
                key={acc.id}
                style={styles.accountCard}
                onPress={() => router.push(`/transactions?accountId=${acc.id}`)}
                onLongPress={() => handleAccountLongPress(acc)}
                delayLongPress={250}
                activeOpacity={0.88}
              >
                <View style={[styles.accountAccentBar, { backgroundColor: accColor }]} />

                <View style={styles.accountCardInner}>
                  <View style={styles.accountCardTop}>
                    <View style={styles.accountCardLead}>
                      <View style={[styles.accountIconBox, { backgroundColor: accColor + '20' }]}>
                        <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={18} color={accColor} />
                      </View>
                      <View style={styles.accountCardMeta}>
                        <Text style={styles.accountCardName} numberOfLines={1}>{acc.name}</Text>
                        <Text style={styles.accountCardHint}>
                          {acc.accountNumber && acc.accountNumber !== 'N/A'
                            ? `•••• ${acc.accountNumber.slice(-4)}`
                            : 'Tap to view activity'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.accountCurrencyBadge}>
                      <Text style={[styles.accountCurrencyText, { color: accColor }]}>{acc.currency}</Text>
                    </View>
                  </View>

                  <Text style={styles.accountBalanceLabel}>AVAILABLE</Text>
                  <MoneyText amount={cardAvailable} currency={acc.currency} style={styles.accountCardBalance} weight="bold" />

                  <View style={styles.accountCardStats}>
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>IN</Text>
                      <MoneyText amount={cardFlow.income} currency={acc.currency} style={styles.accountCardStatValue} type="CR" />
                    </View>
                    <View style={styles.accountCardStatDivider} />
                    <View style={styles.accountCardStatCol}>
                      <Text style={styles.accountCardStatLabel}>OUT</Text>
                      <MoneyText amount={cardFlow.expense} currency={acc.currency} style={styles.accountCardStatValue} type="DR" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.accountPlaceholderCard}
            onPress={() => {
              setEditingAccount(undefined);
              setShowAccountForm(true);
            }}
            activeOpacity={0.88}
          >
            <View style={styles.accountPlaceholderInner}>
              <View style={styles.accountPlaceholderIcon}>
                <Ionicons name="add" size={22} color={colors.text} />
              </View>
              <Text style={styles.accountPlaceholderTitle}>New Account</Text>
              <Text style={styles.accountPlaceholderText}>Add another wallet, bank, or cash account.</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Top expense categories ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOP EXPENSE CATEGORIES</Text>
          <Text style={styles.sectionLink}>{selectedTopCategoryCurrency}</Text>
        </View>

        <View style={styles.topCategoriesCard}>
          {topCategoryCurrencies.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topCategoryTabsRow}>
              {topCategoryCurrencies.map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[styles.topCategoryTab, selectedTopCategoryCurrency === curr && styles.topCategoryTabActive]}
                  onPress={() => setSelectedTopCategoryCurrency(curr)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.topCategoryTabText, selectedTopCategoryCurrency === curr && styles.topCategoryTabTextActive]}>{curr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {topExpenseCategories.length > 0 ? (
            topExpenseCategories.map((category, idx) => {
              const isLast = idx === topExpenseCategories.length - 1;
              const accent = '#' + category.color.toString(16).padStart(6, '0');
              return (
                <View key={`${category.name}-${idx}`} style={[styles.topCategoryRow, isLast && styles.topCategoryRowLast]}>
                  <View style={styles.topCategoryLeft}>
                    <View style={[styles.topCategoryIconWrap, { backgroundColor: accent + '1F' }]}>
                      <Ionicons name={(category.icon as any) || 'pricetag-outline'} size={15} color={accent} />
                    </View>
                    <Text style={styles.topCategoryName} numberOfLines={1}>{category.name}</Text>
                  </View>
                  <MoneyText
                    amount={category.amount}
                    currency={selectedTopCategoryCurrency}
                    type="DR"
                    weight="bold"
                    style={styles.topCategoryAmount}
                  />
                </View>
              );
            })
          ) : (
            <View style={styles.topCategoryEmpty}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.textMuted} />
              <Text style={styles.topCategoryEmptyText}>No expense data yet for {selectedTopCategoryCurrency}</Text>
            </View>
          )}
        </View>

        {/* ── Recent activity ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')} activeOpacity={0.8}>
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {transactions && transactions.length > 0 ? (
            transactions.slice(0, 6).map((tx, idx) => {
              const catColor = tx.category.color
                ? '#' + tx.category.color.toString(16).padStart(6, '0')
                : colors.primary;
              const isLast = idx === Math.min(transactions.length, 6) - 1;
              return (
                <View key={tx.id} style={[styles.txRow, isLast && styles.txRowLast]}>
                  {/* Left accent */}
                  <View style={[styles.txAccent, { backgroundColor: tx.type === 'CR' ? colors.success : colors.danger }]} />
                  <View style={[styles.txIconBox, { backgroundColor: catColor + '18' }]}>
                    <Ionicons name={(tx.category.icon as any) || 'pricetag-outline'} size={18} color={catColor} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle} numberOfLines={1}>{tx.note || tx.category.name}</Text>
                    <View style={styles.txMetaRow}>
                      <View style={[styles.txDot, { backgroundColor: catColor }]} />
                      <Text style={styles.txMeta} numberOfLines={1}>{tx.category.name} · {tx.account.name}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <MoneyText amount={tx.amount} currency={tx.account.currency} type={tx.type} style={styles.txAmount} weight="bold" />
                    <Text style={styles.txDate}>{new Date(tx.datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="receipt-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyActivityText}>No transactions yet</Text>
              <TouchableOpacity style={styles.emptyActivityAction} onPress={() => router.push('/add-transaction')}>
                <Text style={styles.emptyActivityActionText}>Add one now</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.background} />
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-transaction')} activeOpacity={0.9}>
        <Ionicons name="add" size={28} color={colors.background} />
      </TouchableOpacity>

      <AccountFormModal
        visible={showAccountForm}
        onClose={() => setShowAccountForm(false)}
        account={editingAccount}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, screenWidth: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 110,
  },

  /* ── Header ── */
  header: {
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 2,
  },
  brandName: {
    fontFamily: typography.fonts.heading,
    color: colors.text,
    fontSize: 34,
    letterSpacing: -1.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  /* ── Hero balance card ── */
  heroCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    overflow: 'hidden',
  },
  currencyTabsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  currencyTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.background + 'AA',
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyTabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  currencyTabText: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  currencyTabTextActive: {
    color: colors.background,
  },
  heroBadge: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroBalance: {
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -1.5,
    marginBottom: 20,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  splitItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  splitDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  splitLabel: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  splitValue: {
    fontSize: 13,
  },
  splitDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  flowBar: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    gap: 2,
  },
  flowBarIncome: {
    borderRadius: 999,
    backgroundColor: colors.success,
  },
  flowBarExpense: {
    borderRadius: 999,
    backgroundColor: colors.danger,
  },

  /* ── Quick actions ── */
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    gap: 10,
  },
  quickActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.text,
  },
  quickActionPrimaryText: {
    fontFamily: typography.fonts.semibold,
    color: colors.background,
    fontSize: 14,
  },
  quickActionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionSecondaryText: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 14,
  },

  /* ── Section header ── */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionActionText: {
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
    fontSize: 12,
  },
  sectionLink: {
    fontFamily: typography.fonts.semibold,
    color: colors.primary,
    fontSize: 12,
  },

  /* ── Accounts carousel ── */
  accountsScroll: {
    paddingLeft: 24,
    marginBottom: 24,
  },
  accountsScrollContent: {
    paddingRight: 32,
    gap: 12,
  },
  accountCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accountPlaceholderCard: {
    width: screenWidth * 0.7,
    minHeight: 160,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  accountPlaceholderInner: {
    flex: 1,
    minHeight: 157,
    padding: 18,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  accountPlaceholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background + '88',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  accountPlaceholderTitle: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 16,
    marginBottom: 6,
  },
  accountPlaceholderText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 180,
  },
  accountAccentBar: {
    height: 3,
    width: '100%',
  },
  accountCardInner: {
    padding: 14,
  },
  accountCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },
  accountCardLead: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCardMeta: {
    flex: 1,
  },
  accountCardName: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 14,
  },
  accountCardHint: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  accountCurrencyBadge: {
    height: 24,
    minWidth: 48,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background + '80',
  },
  accountCurrencyText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  accountBalanceLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  accountCardBalance: {
    fontSize: 22,
    lineHeight: 25,
    marginBottom: 12,
  },
  accountCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  accountCardStatCol: {
    flex: 1,
  },
  accountCardStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  accountCardStatLabel: {
    fontFamily: typography.fonts.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 3,
  },
  accountCardStatValue: {
    fontSize: 12,
  },

  /* ── Top categories ── */
  topCategoriesCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 22,
  },
  topCategoryTabsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  topCategoryTab: {
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background + 'AA',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  topCategoryTabActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  topCategoryTabText: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  topCategoryTabTextActive: {
    color: colors.background,
  },
  topCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topCategoryRowLast: {
    borderBottomWidth: 0,
  },
  topCategoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  topCategoryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCategoryName: {
    flex: 1,
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 13,
  },
  topCategoryAmount: {
    fontSize: 13,
  },
  topCategoryEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  topCategoryEmptyText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 12,
  },

  /* ── Activity card ── */
  activityCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
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
    marginVertical: 5,
  },
  txIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 3,
  },
  txTitle: {
    fontFamily: typography.fonts.semibold,
    color: colors.text,
    fontSize: 14,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  txDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  txMeta: {
    fontFamily: typography.fonts.regular,
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
  txDate: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 11,
  },

  /* ── Empty activity ── */
  emptyActivity: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyActivityText: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 14,
  },
  emptyActivityAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: colors.text,
  },
  emptyActivityActionText: {
    fontFamily: typography.fonts.semibold,
    color: colors.background,
    fontSize: 12,
  },

  /* ── FAB ── */
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

