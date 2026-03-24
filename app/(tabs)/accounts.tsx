import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { useAccounts, useDeleteAccount } from '../../src/hooks/accounts';
import { Account } from '../../src/api/accounts';
import { AccountFormModal } from '../../src/components/modals/AccountFormModal';

export default function AccountsScreen() {
  const { data: accounts, isLoading } = useAccounts();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleCreate = () => {
    setSelectedAccount(null);
    setModalVisible(true);
  };

  const handleEdit = (account: Account) => {
    setSelectedAccount(account);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This will cascade and permanently delete all transactions associated with this account.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteAccount(id) }
      ]
    );
  };

  const renderItem = ({ item }: { item: Account }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.holderName}>{item.holderName === 'N/A' || !item.holderName ? '---' : item.holderName}</Text>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountNumber}>{item.accountNumber === 'N/A' || !item.accountNumber ? '---' : item.accountNumber}</Text>
        </View>
        <TouchableOpacity style={styles.optionsButton} onPress={() => {
          Alert.alert("Account Options", "Select an action", [
            { text: "Cancel", style: "cancel" },
            { text: "Edit", onPress: () => handleEdit(item) },
            { text: "Delete", style: "destructive", onPress: () => handleDelete(item.id) },
          ]);
        }}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <Text style={styles.balanceLabel}>Total Balance</Text>
      <Text style={styles.balanceValue}>${item.balance.toFixed(2)}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>+${item.income.toFixed(2)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Expense</Text>
          <Text style={[styles.statValue, { color: colors.danger }]}>-${item.expense.toFixed(2)}</Text>
        </View>
      </View>
      
      <Ionicons name="wallet" size={28} color={colors.primary} style={styles.bgIcon} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleCreate}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <AccountFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        account={selectedAccount || undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, paddingHorizontal: 20 },
  title: { color: colors.text, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  listContent: { padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: 24,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, zIndex: 10 },
  cardHeaderLeft: {},
  holderName: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  accountName: { color: colors.textMuted, fontSize: typography.sizes.md, marginTop: 4 },
  accountNumber: { color: colors.textMuted, fontSize: typography.sizes.sm, opacity: 0.7, marginTop: 2 },
  optionsButton: { padding: 4, zIndex: 20 },
  balanceLabel: { color: colors.text, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, textTransform: 'uppercase', marginBottom: 4 },
  balanceValue: { color: colors.text, fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1 },
  statLabel: { color: colors.textMuted, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, textTransform: 'uppercase' },
  statValue: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginTop: 4 },
  bgIcon: { position: 'absolute', bottom: 20, right: 20, opacity: 0.1, fontSize: 80 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
