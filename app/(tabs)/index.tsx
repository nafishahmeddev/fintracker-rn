import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useTransactions } from '../../src/hooks/transactions';
import { useAccounts } from '../../src/hooks/accounts';

export default function DashboardScreen() {
  const router = useRouter();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
  const totalIncome = accounts?.reduce((sum, acc) => sum + acc.income, 0) || 0;
  const totalExpense = accounts?.reduce((sum, acc) => sum + acc.expense, 0) || 0;

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Header / Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.greeting}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
          
          <View style={styles.quickStatsRow}>
            <View style={styles.statBox}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="arrow-down-outline" size={16} color={colors.success} />
              </View>
              <View>
                <Text style={styles.statLabel}>INCOME</Text>
                <Text style={styles.statValue}>${totalIncome.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.danger + '20' }]}>
                <Ionicons name="arrow-up-outline" size={16} color={colors.danger} />
              </View>
              <View>
                <Text style={styles.statLabel}>EXPENSE</Text>
                <Text style={styles.statValue}>${totalExpense.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.push('/add-transaction')}>
            <Ionicons name="add" size={24} color="#000" />
            <Text style={styles.actionBtnPrimaryText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txList}>
          {transactions?.slice(0, 5).map((tx, index) => (
            <BlurView intensity={20} tint="dark" key={tx.id} style={[styles.txRow, index === 4 && { borderBottomWidth: 0 }]}>
              <View style={styles.txLeft}>
                <View style={[styles.txIconBox, { backgroundColor: tx.type === 'CR' ? colors.success + '15' : colors.danger + '15' }]}>
                  <Ionicons name={tx.type === 'CR' ? 'arrow-down' : 'arrow-up'} size={18} color={tx.type === 'CR' ? colors.success : colors.danger} />
                </View>
                <View>
                  <Text style={styles.txTitle}>{tx.title || 'Untitled'}</Text>
                  <Text style={styles.txCategory}>{tx.category?.name || 'Uncategorized'}</Text>
                </View>
              </View>
              <View style={styles.txRight}>
                <Text 
                  style={[
                    styles.txAmount, 
                    { color: tx.type === 'CR' ? colors.success : colors.text }
                  ]}
                >
                  {tx.type === 'CR' ? '+' : '-'}${tx.amount.toFixed(2)}
                </Text>
                <Text style={styles.txDate}>{new Date(tx.datetime).toLocaleDateString()}</Text>
              </View>
            </BlurView>
          ))}
          
          {(!transactions || transactions.length === 0) && (
            <BlurView intensity={10} tint="dark" style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No recent activity.</Text>
            </BlurView>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 40,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  balanceAmount: {
    color: colors.text,
    fontSize: 56,
    fontWeight: typography.weights.bold,
    letterSpacing: -1.5,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  actionsRow: {
    marginBottom: 40,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
  },
  actionBtnPrimaryText: {
    color: '#000000',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    letterSpacing: 1.5,
  },
  seeAll: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  txList: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  txTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: 4,
  },
  txCategory: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  txDate: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 16,
    fontSize: typography.sizes.md,
  },
});
