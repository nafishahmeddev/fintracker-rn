import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import {
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
  const { colors, isDark } = useTheme();
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const createTransaction = useCreateTransaction();

  const accounts = React.useMemo(() => (accountsQuery.data ?? []) as Account[], [accountsQuery.data]);
  const categories = React.useMemo(() => (categoriesQuery.data ?? []) as Category[], [categoriesQuery.data]);

  const [type, setType] = React.useState<TransactionType>('DR');
  const [amountInput, setAmountInput] = React.useState('');
  const [note, setNote] = React.useState('');
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);

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
    !!selectedAccountId &&
    !!selectedCategoryId &&
    amountValue > 0 &&
    !createTransaction.isPending &&
    accounts.length > 0;

  const handleSave = async () => {
    if (!canSubmit || !selectedAccountId || !selectedCategoryId) {
      Alert.alert('Missing details', 'Please select account, category, and a valid amount.');
      return;
    }

    try {
      await createTransaction.mutateAsync({
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
        amount: amountValue,
        type,
        datetime: new Date().toISOString(),
        note: note.trim() || selectedCategory?.name || 'Transaction',
      });

      router.back();
    } catch {
      Alert.alert('Unable to save', 'Could not create transaction. Please try again.');
    }
  };

  const resolvedCurrency = selectedAccount?.currency || profile.defaultCurrency;
  const typeMeta = TYPE_META[type];

  return (
    <SafeAreaView style={styles.container}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View
          style={[
            styles.bgCircle,
            {
              top: -80,
              left: -60,
              width: 320,
              height: 320,
              backgroundColor: colors.primary + '2A',
            },
          ]}
        />
        <View
          style={[
            styles.bgCircle,
            {
              top: 250,
              right: -130,
              width: 420,
              height: 420,
              backgroundColor: colors.text + '12',
            },
          ]}
        />
      </View>

      <BlurView
        blurAmount={Platform.OS === 'ios' ? 80 : 96}
        blurType={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      {Platform.OS === 'android' ? (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]}
          pointerEvents="none"
        />
      ) : null}

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

          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted + '85'}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
          <Text style={styles.amountHint}>{typeMeta.subtitle}</Text>
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
          <Text style={styles.sectionLabel}>NOTE</Text>
          <View style={styles.noteBox}>
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
      marginTop: 8,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
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
    sectionWrap: {
      gap: 10,
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
