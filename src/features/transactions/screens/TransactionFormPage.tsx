import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../components/ui/BlurBackground';
import { Header } from '../../../components/ui/Header';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import {
  useCreateTransaction,
  useTransactionById,
  useUpdateTransaction,
} from '../hooks/transactions';
import { TransactionAmountInput } from '../components/TransactionAmountInput';
import { TransactionTypePicker } from '../components/TransactionTypePicker';
import { TransactionAccountPicker } from '../components/TransactionAccountPicker';
import { TransactionCategoryPicker } from '../components/TransactionCategoryPicker';

type TransactionType = 'CR' | 'DR';

type Props = {
  mode: 'create' | 'edit';
  transactionId?: number | null;
};

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function TransactionFormPage({ mode, transactionId }: Props) {
  const router = useRouter();
  const isEditMode = mode === 'edit';

  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const transactionByIdQuery = useTransactionById(isEditMode ? transactionId ?? null : null);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const accounts = React.useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const categories = React.useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const editingTransaction = React.useMemo(() => {
    if (!isEditMode) return null;
    return transactionByIdQuery.data ?? null;
  }, [transactionByIdQuery.data, isEditMode]);

  const [type, setType] = React.useState<TransactionType>('DR');
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [transactionDateTime, setTransactionDateTime] = React.useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [amountInput, setAmountInput] = React.useState('');
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (!isEditMode || !editingTransaction) return;
    setType(editingTransaction.type);
    setSelectedAccountId(editingTransaction.accountId);
    setSelectedCategoryId(editingTransaction.categoryId);
    setTransactionDateTime(new Date(editingTransaction.datetime));
    setAmountInput(String(editingTransaction.amount));
    setNote(editingTransaction.note ?? '');
  }, [isEditMode, editingTransaction]);

  const filteredCategories = React.useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  React.useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountId(null);
      return;
    }
    if (selectedAccountId === null || !accounts.some((account) => account.id === selectedAccountId)) {
      const preferred = accounts.find((account) => account.isDefault) ?? accounts[0];
      setSelectedAccountId(preferred.id);
    }
  }, [accounts, selectedAccountId]);

  React.useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedCategoryId(null);
      return;
    }
    if (selectedCategoryId === null || !filteredCategories.some((category) => category.id === selectedCategoryId)) {
      setSelectedCategoryId(filteredCategories[0].id);
    }
  }, [filteredCategories, selectedCategoryId]);

  const amountValue = React.useMemo(() => parseAmount(amountInput), [amountInput]);
  const selectedAccount = React.useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );
  const selectedCategory = React.useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  const formattedDate = React.useMemo(
    () => transactionDateTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    [transactionDateTime]
  );

  const formattedTime = React.useMemo(
    () => transactionDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    [transactionDateTime]
  );

  const onDatePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && picked) {
      setTransactionDateTime((curr) => {
        const next = new Date(curr);
        next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
        return next;
      });
    }
  };

  const onTimePicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'set' && picked) {
      setTransactionDateTime((curr) => {
        const next = new Date(curr);
        next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;
  const canSubmit = amountValue > 0 && !!selectedAccountId && !!selectedCategoryId && !isSubmitting;

  const handleSave = async () => {
    if (!selectedAccountId || !selectedCategoryId || amountValue <= 0) {
      Alert.alert('Missing details', 'Please select account, category, and a valid amount.');
      return;
    }

    const payload = {
      accountId: selectedAccountId,
      categoryId: selectedCategoryId,
      amount: amountValue,
      type,
      datetime: transactionDateTime.toISOString(),
      note: note.trim() || selectedCategory?.name || 'Transaction',
    };

    try {
      if (isEditMode && editingTransaction) {
        await updateTransaction.mutateAsync({ id: editingTransaction.id, data: payload });
      } else {
        await createTransaction.mutateAsync(payload);
      }
      router.back();
    } catch {
      Alert.alert('Unable to save', 'Could not save transaction. Please try again.');
    }
  };

  if ((accountsQuery.isLoading || categoriesQuery.isLoading || transactionByIdQuery.isLoading) && isEditMode) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <Header title={isEditMode ? 'Edit Entry' : 'New Entry'} subtitle="Record flow with precision" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TransactionTypePicker value={type} onChange={setType} colors={colors} />

        <TransactionAmountInput
          value={amountInput}
          onChange={setAmountInput}
          currency={selectedAccount?.currency ?? profile.defaultCurrency}
          colors={colors}
        />

        <View style={styles.formBody}>
          
          <TransactionAccountPicker
            accounts={accounts}
            selectedId={selectedAccountId}
            onSelect={setSelectedAccountId}
            colors={colors}
          />

          <TransactionCategoryPicker
            categories={filteredCategories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            colors={colors}
          />

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATE & TIME</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={styles.dateTimeText}>{formattedDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateTimeBtn} onPress={() => setShowTimePicker(true)}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.dateTimeText}>{formattedTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker value={transactionDateTime} mode="date" display="default" onChange={onDatePicked} />
          )}
          {showTimePicker && (
            <DateTimePicker value={transactionDateTime} mode="time" display="default" onChange={onTimePicked} />
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTE</Text>
            <View style={styles.noteContainer}>
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Optional context"
                placeholderTextColor={colors.textMuted + '80'}
                multiline
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveBtnText}>{isEditMode ? 'Save Changes' : 'Save Transaction'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    content: {
      paddingBottom: 120,
    },
    formBody: {
      gap: 16,
    },
    section: {
      paddingHorizontal: 24,
      gap: 12,
    },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.5,
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: 12,
    },
    dateTimeBtn: {
      flex: 1,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    dateTimeText: {
      fontFamily: typography.fonts.medium,
      fontSize: 13,
      color: colors.text,
    },
    noteContainer: {
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      minHeight: 100,
    },
    noteInput: {
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.text,
      textAlignVertical: 'top',
    },
    footer: {
      position: 'absolute',
      bottom: 34,
      left: 24,
      right: 24,
    },
    saveBtn: {
      height: 56,
      borderRadius: 18,
      backgroundColor: colors.text,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 16,
      color: colors.background,
    },
  });
