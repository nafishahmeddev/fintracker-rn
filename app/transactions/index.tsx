import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { Header } from '../../src/components/ui/Header';
import { MoneyText } from '../../src/components/ui/MoneyText';
import { useAccounts } from '../../src/features/accounts/hooks/accounts';
import { useTransactions } from '../../src/features/transactions/hooks/transactions';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';

export default function TransactionsScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: transactions, isLoading } = useTransactions();
  const { data: accounts } = useAccounts();

  const params = useLocalSearchParams();


  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeAccountId, setActiveAccountId] = useState<number | null>(params.accountId ? Number(params.accountId) : null);
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');

  const filteredTransactions = React.useMemo(() => {
    if (!transactions) return [];
    let result = transactions;

    if (activeAccountId) {
      result = result.filter(t => t.accountId === activeAccountId);
    }

    if (dateFilter !== 'ALL') {
      const now = new Date();
      result = result.filter(t => {
        const d = new Date(t.datetime);
        if (dateFilter === 'THIS_MONTH') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'LAST_MONTH') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
        }
        return true;
      });
    }

    return result;
  }, [transactions, activeAccountId, dateFilter]);

  const renderFilterModal = () => (
    <Modal visible={filterModalVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>FILTERS</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={styles.filterSectionTitle}>ACCOUNT</Text>
            <View style={styles.pillContainer}>
              <TouchableOpacity
                style={[styles.pill, !activeAccountId && styles.pillActive]}
                onPress={() => setActiveAccountId(null)}
              >
                <Text style={[styles.pillText, !activeAccountId && styles.pillTextActive]}>All Accounts</Text>
              </TouchableOpacity>
              {accounts?.map(acc => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.pill, activeAccountId === acc.id && styles.pillActive]}
                  onPress={() => setActiveAccountId(acc.id)}
                >
                  <Text style={[styles.pillText, activeAccountId === acc.id && styles.pillTextActive]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>DATE RANGE</Text>
            <View style={styles.pillContainer}>
              {(['ALL', 'THIS_MONTH', 'LAST_MONTH'] as const).map(dt => (
                <TouchableOpacity
                  key={dt}
                  style={[styles.pill, dateFilter === dt && styles.pillActive]}
                  onPress={() => setDateFilter(dt)}
                >
                  <Text style={[styles.pillText, dateFilter === dt && styles.pillTextActive]}>
                    {dt.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Button title="APPLY FILTERS" onPress={() => setFilterModalVisible(false)} style={{ marginTop: 24 }} />
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={activeAccountId ? 'Account Ledger' : 'All Activity'}
        showBack
        rightAction={
          <TouchableOpacity onPress={() => setFilterModalVisible(true)} style={styles.filterTrigger}>
            <Ionicons name="options-outline" size={24} color={colors.text} />
            {(activeAccountId || dateFilter !== 'ALL') && <View style={styles.filterDot} />}
          </TouchableOpacity>
        }
      />

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions found.</Text>
        }
        renderItem={({ item: tx }) => {
          const catColor = tx.category.color ? '#' + tx.category.color.toString(16).padStart(6, '0') : colors.primary;
          return (
            <View style={styles.txRow}>
              <View style={styles.txLeft}>
                <View style={[styles.txIconBox, { backgroundColor: catColor + '15' }]}>
                  <Ionicons name={tx.category.icon as any || 'pricetag'} size={22} color={catColor} />
                </View>
                <View style={styles.txMeta}>
                  <Text style={styles.txTitle} numberOfLines={1}>{tx.note || 'Untitled'}</Text>
                  <Text style={styles.txSubtitle}>
                    {tx.category.name} • {new Date(tx.datetime).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <MoneyText
                amount={tx.amount}
                type={tx.type}
                style={styles.txAmount}
              />
            </View>
          );
        }}
      />

      {renderFilterModal()}
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },

  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  txMeta: {
    flex: 1,
  },
  txTitle: {
    // @ts-ignore
    fontFamily: typography.fonts.headingRegular,
    color: colors.text,
    fontSize: typography.sizes.md,
    letterSpacing: -0.2,
  },
  txSubtitle: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  txAmount: {
    fontFamily: typography.fonts.amountBold,
    fontSize: typography.sizes.md,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 60,
    fontSize: typography.sizes.sm,
    textTransform: 'uppercase',
  },

  filterTrigger: {
    position: 'relative',
    padding: 8,
  },
  filterDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    // @ts-ignore
    fontFamily: typography.fonts.heading,
    fontSize: typography.sizes.xl,
    color: colors.text,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 1.5,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pillActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  pillText: {
    fontFamily: typography.fonts.semibold,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.background,
    fontFamily: typography.fonts.semibold,
  },
});
