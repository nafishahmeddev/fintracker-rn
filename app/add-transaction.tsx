import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { useCreateTransaction } from '../src/features/transactions/hooks';
import { useAccounts } from '../src/features/accounts/hooks';
import { useCategories } from '../src/features/categories/hooks';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  // Basic Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'CR' | 'DR'>('DR');

  // Hardcoded for now. In a real app we would use dropdowns.
  // Grabbing the first available account & category ID for demo purposes.
  const accountId = accounts?.[0]?.id;
  const categoryId = categories?.[0]?.id;

  const handleSave = async () => {
    if (!accountId || !categoryId) {
      alert("Please ensure at least one account and category exists first.");
      return;
    }
    
    if (!title || !amount) {
      alert("Please fill all fields.");
      return;
    }

    try {
      await createTransaction({
        accountId,
        categoryId,
        amount: parseFloat(amount),
        title,
        type,
        datetime: new Date().toISOString(),
      });
      router.back();
    } catch {
      alert("Error saving transaction");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>New Transaction</Text>

      <View style={styles.switchContainer}>
        <Button 
          title="Expense" 
          variant={type === 'DR' ? 'danger' : 'outline'} 
          onPress={() => setType('DR')}
          style={styles.switchBtn}
        />
        <Button 
          title="Income" 
          variant={type === 'CR' ? 'success' : 'outline'} 
          onPress={() => setType('CR')}
          style={styles.switchBtn}
        />
      </View>

      <Input
        label="Title"
        placeholder="e.g. Groceries"
        value={title}
        onChangeText={setTitle}
      />

      <Input
        label="Amount"
        placeholder="0.00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      {/* For MVP we are skipping full dropdown pickers for Account/Category */}
      <Text style={styles.hint}>
        Note: Transaction will be assigned to default Account ({accounts?.[0]?.name || 'N/A'}) 
        and Category ({categories?.[0]?.name || 'N/A'})
      </Text>

      <Button 
        title="Save Transaction" 
        onPress={handleSave} 
        isLoading={isPending}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    marginBottom: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  switchBtn: {
    flex: 1,
  },
  hint: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    marginBottom: 32,
    marginTop: 8,
  },
  saveBtn: {
    marginTop: 16,
  },
});
