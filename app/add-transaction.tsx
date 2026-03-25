import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../src/components/ui/BlurBackground';
import { accounts as accountsTable, categories as categoriesTable } from '../src/db/schema';
import { useAccounts } from '../src/features/accounts/hooks/accounts';
import { useCategories } from '../src/features/categories/hooks/categories';
import { useCreateTransaction } from '../src/features/transactions/hooks/transactions';
import { useSettings } from '../src/providers/SettingsProvider';
import { useTheme } from '../src/providers/ThemeProvider';
import { ThemeColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

type TransactionType = 'CR' | 'DR';
type Account = typeof accountsTable.$inferSelect;
type Category = typeof categoriesTable.$inferSelect;
type IoniconName = keyof typeof Ionicons.glyphMap;

type TransactionFormValues = {
  amountInput: string;
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

export default function AddTransactionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const createTransaction = useCreateTransaction();

  const accounts = React.useMemo(() => (accountsQuery.data ?? []) as Account[], [accountsQuery.data]);
  const categories = React.useMemo(() => (categoriesQuery.data ?? []) as Category[], [categoriesQuery.data]);

  const [type, setType] = React.useState<TransactionType>('DR');
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [transactionDateTime, setTransactionDateTime] = React.useState<Date>(() => new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<TransactionFormValues>({
    mode: 'onChange',
    defaultValues: { amountInput: '', note: '' },
  });

  const amountInput = watch('amountInput');
  const amountValue = React.useMemo(() => parseAmount(amountInput), [amountInput]);

  const filteredCategories = React.useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

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

  const canSubmit =
    isValid &&
    !!selectedAccountId &&
    !!selectedCategoryId &&
    !createTransaction.isPending &&
    accounts.length > 0;

  const handleSave = handleSubmit(async (data) => {
    if (!selectedAccountId || !selectedCategoryId) {
      Alert.alert('Missing details', 'Please select account, category, and a valid amount.');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
        amount: parseAmount(data.amountInput),
        type,
        datetime: transactionDateTime.toISOString(),
        note: data.note.trim() || selectedCategory?.name || 'Transaction',
      });

      router.back();
    } catch {
      Alert.alert('Unable to save', 'Could not create transaction. Please try again.');
    }
  });

  const resolvedCurrency = selectedAccount?.currency || profile.defaultCurrency;
  const typeMeta = TYPE_META[type];

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()} activeOpacity={0.9}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <Text style={styles.headerSubtitle}>Capture it once, keep your ledger clean</Text>
        </View>
        <View style={styles.headerButtonGhost} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.amountPanel}>
          <Text style={styles.panelLabel}>AMOUNT</Text>
          <View style={styles.amountTopRow}>
            <View style={styles.currencyPill}>
              <Text style={styles.currencyPillText}>{resolvedCurrency}</Text>
            </View>
            <View style={[styles.typeSignalPill, type === 'CR' ? styles.typeSignalIncome : styles.typeSignalExpense]}>
              <Ionicons name={typeMeta.icon} size={14} color={type === 'CR' ? colors.success : colors.danger} />
              <Text style={[styles.typeSignalText, { color: type === 'CR' ? colors.success : colors.danger }]}>
                {typeMeta.title}
              </Text>
            </View>
          </View>

          <Controller
            control={control}
            name="amountInput"
            rules={{
              required: 'Amount is required',
              validate: (v) => parseAmount(v) > 0 || 'Enter a valid amount greater than 0',
            }}
            render={({ field }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted + '85'}
                keyboardType="decimal-pad"
                style={styles.amountInput}
              />
            )}
          />
          <Text style={styles.amountHint}>{typeMeta.subtitle}</Text>
          {errors.amountInput && (
            <Text style={styles.fieldError}>{errors.amountInput.message}</Text>
          )}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>FLOW TYPE</Text>
          <View style={styles.segmentedWrap}>
            {(['DR', 'CR'] as const).map((option) => {
              const selected = option === type;
              const optionMeta = TYPE_META[option];
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                  onPress={() => setType(option)}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name={optionMeta.icon}
                    size={16}
                    color={selected ? colors.background : colors.textMuted}
                  />
                  <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{optionMeta.title}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
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
                      <Ionicons name={(account.icon || 'wallet-outline') as IoniconName} size={17} color={accent} />
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
                        name={(category.icon || 'pricetag-outline') as IoniconName}
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

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>DATE & TIME</Text>
          <View style={styles.noteBox}>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)} activeOpacity={0.9}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={styles.dateTimeButtonText}>{formattedDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)} activeOpacity={0.9}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
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
                    <Text style={styles.emptyActionText}>Done</Text>
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
                    <Text style={styles.emptyActionText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>NOTE</Text>
          <View style={styles.noteBox}>
            <Controller
              control={control}
              name="note"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Optional context"
                  placeholderTextColor={colors.textMuted + '88'}
                  style={styles.noteInput}
                  multiline
                  textAlignVertical="top"
                />
              )}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.92}
          disabled={!canSubmit}
        >
          <Text style={styles.saveButtonText}>
            {createTransaction.isPending ? 'Saving...' : `Save ${typeMeta.title}`}
          </Text>
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
    bgCircle: {
      position: 'absolute',
      borderRadius: 999,
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
      gap: 20,
    },
    amountPanel: {
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 2,
    },
    panelLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.3,
      marginBottom: 10,
    },
    amountTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    currencyPill: {
      borderRadius: 999,
      paddingHorizontal: 12,
      height: 30,
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencyPillText: {
      fontFamily: typography.fonts.semibold,
      color: colors.text,
      fontSize: 12,
      letterSpacing: 0.3,
    },
    typeSignalPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: 999,
      paddingHorizontal: 10,
      height: 30,
      borderWidth: 1,
    },
    typeSignalIncome: {
      backgroundColor: colors.success + '18',
      borderColor: colors.success + '30',
    },
    typeSignalExpense: {
      backgroundColor: colors.danger + '18',
      borderColor: colors.danger + '30',
    },
    typeSignalText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
    },
    amountInput: {
      fontFamily: typography.fonts.amountBold,
      fontSize: 42,
      lineHeight: 46,
      color: colors.text,
      letterSpacing: -1,
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    amountHint: {
      marginTop: 2,
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
    sectionWrap: {
      gap: 12,
    },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.25,
    },
    segmentedWrap: {
      flexDirection: 'row',
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      padding: 4,
      gap: 6,
    },
    segmentButton: {
      flex: 1,
      borderRadius: 12,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      backgroundColor: 'transparent',
    },
    segmentButtonActive: {
      backgroundColor: colors.text,
    },
    segmentText: {
      fontFamily: typography.fonts.medium,
      fontSize: 14,
      color: colors.textMuted,
    },
    segmentTextActive: {
      color: colors.background,
      fontFamily: typography.fonts.semibold,
    },
    choiceRow: {
      paddingRight: 10,
      paddingVertical: 4,
      gap: 10,
    },
    choiceCard: {
      width: 126,
      borderRadius: 14,
      padding: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    choiceCardActive: {},
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
    choiceTitleActive: {},
    choiceMeta: {
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      fontSize: 12,
      marginTop: -2,
    },
    choiceMetaActive: {},
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
    noteBox: {
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
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
