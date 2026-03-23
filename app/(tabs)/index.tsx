import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useTransactions } from '../../src/features/transactions/hooks';
import { useAccounts } from '../../src/features/accounts/hooks';
import { Card } from '../../src/components/ui/Card';

export default function DashboardScreen() {
  const router = useRouter();
  const { data: transactions, isLoading: txLoading } = useTransactions();
  const { data: accounts, isLoading: accountsLoading } = useAccounts();

  const totalBalance = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;

  if (txLoading || accountsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${totalBalance.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/add-transaction')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/transactions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {transactions?.slice(0, 5).map((tx) => (
          <Card key={tx.id} style={styles.txCard}>
            <View style={styles.txRow}>
              <View>
                <Text style={styles.txTitle}>{tx.title || 'Untitled'}</Text>
                <Text style={styles.txCategory}>{tx.category.name}</Text>
              </View>
              <Text 
                style={[
                  styles.txAmount, 
                  { color: tx.type === 'CR' ? colors.success : colors.danger }
                ]}
              >
                {tx.type === 'CR' ? '+' : '-'}${tx.amount.toFixed(2)}
              </Text>
            </View>
          </Card>
        ))}

        {(!transactions || transactions.length === 0) && (
          <Text style={styles.emptyText}>No transactions yet.</Text>
        )}
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  greeting: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold as any,
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    marginBottom: 32,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.sizes.md,
  },
  balanceAmount: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: typography.weights.bold as any,
    marginVertical: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: typography.weights.semibold as any,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
  },
  seeAll: {
    color: colors.primaryLight,
    fontWeight: typography.weights.medium as any,
  },
  txCard: {
    marginBottom: 12,
    padding: 16,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
  },
  txCategory: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
  txAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
    fontSize: typography.sizes.md,
  },
});
