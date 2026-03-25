import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { BlurBackground } from '../src/components/ui/BlurBackground';
import { accounts as accountsTable, categories as categoriesTable } from '../src/db/schema';
import { useAccounts } from '../src/features/accounts/hooks/accounts';
import { useCategories } from '../src/features/categories/hooks/categories';
import {
  useCreateTransaction,
  useTransactions,
  useUpdateTransaction,
} from '../src/features/transactions/hooks/transactions';
import { useSettings } from '../src/providers/SettingsProvider';
import { useTheme } from '../src/providers/ThemeProvider';
import { ThemeColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

type TransactionType = 'CR' | 'DR';
type Account = typeof accountsTable.$inferSelect;
type Category = typeof categoriesTable.$inferSelect;
type IoniconName = keyof typeof Ionicons.glyphMap;

type LedgerTransaction = {
  id: number;
  accountId: number;
  categoryId: number;
  amount: number;
  type: 'CR' | 'DR';
  datetime: string;
  note: string;
};

const TYPE_META: Record<TransactionType, { title: string; subtitle: string; icon: IoniconName }> = {
  CR: { title: 'Income', subtitle: 'Cash coming in', icon: 'trending-up-outline' },
  DR: { title: 'Expense', subtitle: 'Cash going out', icon: 'trending-down-outline' },
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveIcon = (raw: string | null | undefined, fallback: IoniconName): IoniconName => {
  if (!raw) return fallback;
  return raw in Ionicons.glyphMap ? (raw as IoniconName) : fallback;
};

const resolveParamNumber = (value: string | string[] | undefined): number | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function AddTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const editingId = React.useMemo(() => resolveParamNumber(params.id), [params.id]);
  const isEditMode = editingId !== null;

  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const transactionsQuery = useTransactions();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const accounts = React.useMemo(() => (accountsQuery.data ?? []) as Account[], [accountsQuery.data]);
  const categories = React.useMemo(() => (categoriesQuery.data ?? []) as Category[], [categoriesQuery.data]);
  const transactions = React.useMemo(() => (transactionsQuery.data ?? []) as LedgerTransaction[], [transactionsQuery.data]);

  const editingTransaction = React.useMemo(() => {
    if (editingId === null) return null;
    return transactions.find((tx) => tx.id === editingId) ?? null;
  }, [transactions, editingId]);

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

    if (
      selectedCategoryId === null ||
      !filteredCategories.some((category) => category.id === selectedCategoryId)
    ) {
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
    () =>
      transactionDateTime.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [transactionDateTime]
  );

  const formattedTime = React.useMemo(
    () => transactionDateTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    [transactionDateTime]
  );

  const applyDatePart = React.useCallback((picked: Date) => {
    setTransactionDateTime((current) => {
      const next = new Date(current);
      next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      return next;
    });
  }, []);

  const applyTimePart = React.useCallback((picked: Date) => {
    setTransactionDateTime((current) => {
      const next = new Date(current);
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      return next;
    });
  }, []);

  const onDatePicked = React.useCallback((event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && picked) {
      applyDatePart(picked);
    }
  }, [applyDatePart]);

  const onTimePicked = React.useCallback((event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && picked) {
      applyTimePart(picked);
    }
  }, [applyTimePart]);

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;
  const canSubmit =
    amountValue > 0 &&
    !!selectedAccountId &&
    !!selectedCategoryId &&
    !isSubmitting &&
    accounts.length > 0;

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

  const resolvedCurrency = selectedAccount?.currency || profile.defaultCurrency;
  const typeMeta = TYPE_META[type];

  if ((accountsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading) && isEditMode) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isEditMode && !editingTransaction) {
    return (
      <SafeAreaView style={styles.container}>
        <BlurBackground />
        <View style={styles.emptyPanelStandalone}>
          <Text style={styles.emptyTitle}>Transaction not found</Text>
          <Text style={styles.emptySubtitle}>It may have been deleted.</Text>
          <TouchableOpacity style={styles.emptyAction} onPress={() => router.back()} activeOpacity={0.9}>
            <Text style={styles.emptyActionText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Entry' : 'New Entry'}</Text>
          <Text style={styles.headerSubtitle}>Record flow with precision</Text>
        </View>
        <View style={styles.headerButtonGhost} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.eyebrow}>AMOUNT</Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>{resolvedCurrency}</Text>
            </View>
          </View>

          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted + '85'}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
          <Text style={styles.amountHint}>{typeMeta.subtitle}</Text>
          {amountInput.length > 0 && amountValue <= 0 && (
            <Text style={styles.fieldError}>Enter a valid amount greater than 0</Text>
          )}

          <View style={styles.typeRow}>
            {(['DR', 'CR'] as const).map((option) => {
              const selected = option === type;
              const optionMeta = TYPE_META[option];
              const isIncome = option === 'CR';
              const accent = isIncome ? colors.success : colors.danger;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.typeCard,
                    selected
                      ? { borderColor: accent, backgroundColor: accent + '1A' }
                      : null,
                  ]}
                  onPress={() => setType(option)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.typeCardIconWrap, { backgroundColor: selected ? accent + '2A' : colors.surface }]}> 
                    <Ionicons
                      name={optionMeta.icon}
                      size={16}
                      color={selected ? accent : colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.typeCardTitle, selected && { color: colors.text }]}>{optionMeta.title}</Text>
                  <Text style={[styles.typeCardSubtitle, selected && { color: colors.textMuted }]}>{optionMeta.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.eyebrow}>WHEN</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.9}>
              <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
              <Text style={styles.dateTimeButtonText}>{formattedDate}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)} activeOpacity={0.9}>
              <Ionicons name="time-outline" size={15} color={colors.textMuted} />
              <Text style={styles.dateTimeButtonText}>{formattedTime}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <View style={styles.inlinePickerWrap}>
              <DateTimePicker
                value={transactionDateTime}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDatePicked}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.inlinePickerDone} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.inlinePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {showTimePicker && (
            <View style={styles.inlinePickerWrap}>
              <DateTimePicker
                value={transactionDateTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimePicked}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.inlinePickerDone} onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.inlinePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>SOURCE ACCOUNT</Text>
          {accounts.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No accounts available</Text>
              <Text style={styles.emptySubtitle}>Create an account first to add transactions.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
              {accounts.map((account) => {
                const selected = account.id === selectedAccountId;
                const accent = toHexColor(account.color);
                return (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.choiceCard,
                      selected
                        ? { backgroundColor: accent + '22', borderColor: accent, borderWidth: 2 }
                        : null,
                    ]}
                    onPress={() => setSelectedAccountId(account.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.choiceIconWrap, { backgroundColor: selected ? accent + '30' : accent + '18' }]}> 
                      <Ionicons name={resolveIcon(account.icon, 'wallet-outline')} size={17} color={accent} />
                    </View>
                    <Text style={[styles.choiceTitle, selected && { color: colors.text }]} numberOfLines={1}>
                      {account.name}
                    </Text>
                    <View style={styles.choiceFooter}>
                      <Text style={[styles.choiceMeta, selected && { color: accent, fontFamily: typography.fonts.semibold }]}> 
                        {account.currency}
                      </Text>
                      {selected ? (
                        <Ionicons name="checkmark-circle" size={14} color={accent} />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>NOTE</Text>
          <View style={styles.sectionCard}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Optional context"
              placeholderTextColor={colors.textMuted + '88'}
              style={styles.noteInput}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>CATEGORY</Text>
          {filteredCategories.length === 0 ? (
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyTitle}>No matching categories</Text>
              <Text style={styles.emptySubtitle}>Create a {type === 'CR' ? 'income' : 'expense'} category.</Text>
              <TouchableOpacity
                style={styles.emptyAction}
                onPress={() => router.push('/categories')}
                activeOpacity={0.9}
              >
                <Text style={styles.emptyActionText}>Manage Categories</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.categoryChipsWrap}>
              {filteredCategories.map((category) => {
                const selected = category.id === selectedCategoryId;
                const accent = toHexColor(category.color);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selected && { backgroundColor: accent + '20', borderColor: accent + '55' },
                    ]}
                    onPress={() => setSelectedCategoryId(category.id)}
                    activeOpacity={0.9}
                  >
                    <View
                      style={[
                        styles.categoryChipIconWrap,
                        { backgroundColor: selected ? accent + '28' : colors.surface },
                      ]}
                    >
                      <Ionicons
                        name={resolveIcon(category.icon, 'pricetag-outline')}
                        size={14}
                        color={selected ? accent : colors.textMuted}
                      />
                    </View>
                    <Text style={[styles.categoryChipText, selected && { color: colors.text }]} numberOfLines={1}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.92}
          disabled={!canSubmit}
        >
          {isSubmitting ? (
            <View style={styles.saveBusyWrap}>
              <ActivityIndicator size="small" color={colors.background} />
              <Text style={styles.saveButtonText}>Saving...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>{isEditMode ? 'Save Changes' : `Save ${typeMeta.title}`}</Text>
          )}
          <Text style={styles.saveAmountText}>{`${resolvedCurrency} ${amountValue > 0 ? amountValue.toFixed(2) : '0.00'}`}</Text>
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
      overflow: 'hidden',
    },
    loadingWrap: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      marginTop: 12,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerButtonGhost: {
      width: 44,
    },
    headerTextWrap: {
      flex: 1,
      paddingHorizontal: 14,
    },
    headerTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 28,
      color: colors.text,
      letterSpacing: -0.7,
      lineHeight: 30,
    },
    headerSubtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 140,
      gap: 18,
    },
    heroCard: {
      borderRadius: 24,
      padding: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
      gap: 12,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    eyebrow: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.25,
    },
    currencyBadge: {
      height: 28,
      borderRadius: 999,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    currencyBadgeText: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 12,
    },
    amountInput: {
      fontFamily: typography.fonts.amountBold,
      fontSize: 48,
      lineHeight: 52,
      color: colors.text,
      letterSpacing: -1.2,
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    amountHint: {
      marginTop: -4,
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
    },
    fieldError: {
      marginTop: 4,
      color: colors.danger,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
    },
    typeRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    typeCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background + 'A8',
      padding: 10,
      gap: 4,
    },
    typeCardIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 2,
    },
    typeCardTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
      color: colors.textMuted,
    },
    typeCardSubtitle: {
      fontFamily: typography.fonts.regular,
      fontSize: 11,
      color: colors.textMuted + 'BB',
    },
    sectionWrap: {
      gap: 10,
    },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.25,
    },
    sectionCard: {
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    choiceRow: {
      paddingRight: 10,
      paddingVertical: 4,
      gap: 10,
    },
    choiceCard: {
      width: 156,
      borderRadius: 14,
      padding: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    choiceFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: -2,
    },
    choiceIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    choiceTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },
    choiceMeta: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 12,
      marginTop: -2,
    },
    categoryChipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryChip: {
      borderRadius: 999,
      paddingHorizontal: 10,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 7,
    },
    categoryChipIconWrap: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryChipText: {
      fontFamily: typography.fonts.medium,
      color: colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
    },
    dateTimeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    dateTimeButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 8,
    },
    dateTimeButtonText: {
      fontFamily: typography.fonts.medium,
      color: colors.text,
      fontSize: 13,
      textAlign: 'center',
    },
    inlinePickerWrap: {
      marginTop: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    inlinePickerDone: {
      alignSelf: 'flex-end',
      margin: 10,
      borderRadius: 999,
      paddingHorizontal: 10,
      height: 28,
      justifyContent: 'center',
      backgroundColor: colors.text,
    },
    inlinePickerDoneText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
    },
    noteInput: {
      minHeight: 80,
      color: colors.text,
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      padding: 0,
    },
    emptyPanel: {
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyPanelStandalone: {
      margin: 24,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'flex-start',
      gap: 4,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
    },
    emptySubtitle: {
      marginTop: 4,
      color: colors.textMuted,
      fontFamily: typography.fonts.regular,
      fontSize: 13,
    },
    emptyAction: {
      marginTop: 12,
      alignSelf: 'flex-start',
      borderRadius: 999,
      paddingHorizontal: 12,
      height: 32,
      justifyContent: 'center',
      backgroundColor: colors.text,
    },
    emptyActionText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
    },
    footerBar: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 18,
    },
    saveButton: {
      borderRadius: 18,
      minHeight: 64,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: colors.text,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButtonDisabled: {
      opacity: 0.55,
    },
    saveBusyWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    saveButtonText: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
      fontSize: 16,
    },
    saveAmountText: {
      color: colors.background,
      fontFamily: typography.fonts.amountBold,
      fontSize: 16,
    },
  });
