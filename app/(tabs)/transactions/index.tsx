import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { useTransactions } from '../../../src/features/transactions/hooks';
import { Card } from '../../../src/components/ui/Card';

export default function TransactionsScreen() {
  const { data: transactions, isLoading } = useTransactions();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Transactions</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions found.</Text>
        }
        renderItem={({ item: tx }) => (
          <Card style={styles.txCard}>
            <View style={styles.txRow}>
              <View>
                <Text style={styles.txTitle}>{tx.title || 'Untitled'}</Text>
                <Text style={styles.txSubtitle}>
                  {tx.category.name} • {new Date(tx.datetime).toLocaleDateString()}
                </Text>
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
        )}
      />
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  txCard: {
    marginBottom: 12,
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
  txSubtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
  txAmount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: typography.sizes.md,
  },
});
