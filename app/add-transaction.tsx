import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';

import { useCreateTransaction } from '../src/features/transactions/hooks';
import { useAccounts } from '../src/features/accounts/hooks';
import { useCategories } from '../src/features/categories/hooks';

import { AccountFormModal } from '../src/features/accounts/components/AccountFormModal';
import { CategoryFormModal } from '../src/features/categories/components/CategoryFormModal';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { mutateAsync: createTransaction, isPending: isSaving } = useCreateTransaction();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'CR' | 'DR'>('DR');
  const [accountId, setAccountId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleSave = async () => {
    if (!accountId || !categoryId) {
      return alert("Please select an Account and a Category.");
    }
    if (!title || !amount) {
      return alert("Please provide a Title and Amount.");
    }

    try {
      await createTransaction({
        accountId,
        categoryId,
        amount: parseFloat(amount) || 0,
        title,
        description,
        type,
        datetime: date.toISOString(),
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

      <Input label="Title" placeholder="e.g. Groceries" value={title} onChangeText={setTitle} />
      <Input label="Description (Optional)" placeholder="Additional notes..." value={description} onChangeText={setDescription} />
      <Input label="Amount" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

      {/* Date & Time Picker Triggers */}
      <View style={styles.datetimeRow}>
        <TouchableOpacity style={styles.datetimeBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.datetimeText}>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.datetimeBtn} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={styles.datetimeText}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (d) setDate(prev => new Date(d.setHours(prev.getHours(), prev.getMinutes())));
          }}
        />
      )}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(e, d) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (d) setDate(prev => new Date(prev.setHours(d.getHours(), d.getMinutes())));
          }}
        />
      )}

      {/* Horizontal Selectors */}
      <Text style={styles.sectionLabel}>Select Account</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
        <TouchableOpacity style={[styles.pickerItem, styles.pickerAdd]} onPress={() => setShowAccountModal(true)}>
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={styles.pickerAddText}>New</Text>
        </TouchableOpacity>
        {accounts?.map((acc) => (
          <TouchableOpacity 
            key={'acc-'+acc.id} 
            style={[styles.pickerItem, accountId === acc.id && styles.pickerSelected]}
            onPress={() => setAccountId(acc.id)}
          >
            <Ionicons name="wallet" size={24} color={accountId === acc.id ? colors.primary : colors.textMuted} />
            <Text style={[styles.pickerText, accountId === acc.id && styles.pickerSelectedText]}>{acc.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionLabel}>Select Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll} contentContainerStyle={styles.pickerContent}>
        <TouchableOpacity style={[styles.pickerItem, styles.pickerAdd]} onPress={() => setShowCategoryModal(true)}>
          <Ionicons name="add" size={24} color={colors.primary} />
          <Text style={styles.pickerAddText}>New</Text>
        </TouchableOpacity>
        {categories?.map((cat) => (
          <TouchableOpacity 
            key={'cat-'+cat.id} 
            style={[styles.pickerItem, categoryId === cat.id && styles.pickerSelected]}
            onPress={() => setCategoryId(cat.id)}
          >
            <Ionicons name="grid" size={24} color={categoryId === cat.id ? colors.primary : colors.textMuted} />
            <Text style={[styles.pickerText, categoryId === cat.id && styles.pickerSelectedText]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Button title="Save Transaction" onPress={handleSave} isLoading={isSaving} style={styles.saveBtn} />

      <AccountFormModal visible={showAccountModal} onClose={() => setShowAccountModal(false)} />
      <CategoryFormModal visible={showCategoryModal} onClose={() => setShowCategoryModal(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 60 },
  headerTitle: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 24 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  switchBtn: { flex: 1 },
  
  datetimeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 24, paddingHorizontal: 4 },
  datetimeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  datetimeText: { marginLeft: 8, color: colors.text, fontSize: typography.sizes.md },

  sectionLabel: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text, marginBottom: 12, marginLeft: 4 },
  pickerScroll: { marginBottom: 24 },
  pickerContent: { paddingRight: 20 },
  pickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    minWidth: 90,
  },
  pickerSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  pickerSelectedText: { color: colors.primary, fontWeight: typography.weights.bold },
  pickerText: { color: colors.text, fontSize: typography.sizes.sm, marginTop: 8 },
  pickerAdd: { borderColor: colors.primary, borderStyle: 'dashed' },
  pickerAddText: { color: colors.primary, fontSize: typography.sizes.sm, marginTop: 8 },

  saveBtn: { marginTop: 16 },
});
