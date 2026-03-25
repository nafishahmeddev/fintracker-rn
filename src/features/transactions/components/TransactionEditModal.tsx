import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { accounts as accountsTable, categories as categoriesTable } from '../../../db/schema';
import { useSettings } from '../../../providers/SettingsProvider';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { useAccounts } from '../../accounts/hooks/accounts';
import { useCategories } from '../../categories/hooks/categories';
import { useCreateTransaction, useUpdateTransaction } from '../hooks/transactions';

type TransactionType = 'CR' | 'DR';
type Account = typeof accountsTable.$inferSelect;
type Category = typeof categoriesTable.$inferSelect;
type IoniconName = keyof typeof Ionicons.glyphMap;

export type LedgerTransaction = {
  id: number;
  accountId: number;
  categoryId: number;
  amount: number;
  type: 'CR' | 'DR';
  datetime: string;
  note: string;
  account: { id: number; name: string; currency: string; color: number };
  category: { id: number; name: string; icon: string; color: number };
};

type Props = {
  visible: boolean;
  transaction: LedgerTransaction | null;
  mode?: 'create' | 'edit';
  presentation?: 'modal' | 'page';
  onClose: () => void;
  onSaved?: () => void;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

const parseAmount = (raw: string): number => {
  const normalized = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveIconName = (raw: string, fallback: IoniconName): IoniconName =>
  raw in Ionicons.glyphMap ? (raw as IoniconName) : fallback;

const TYPE_META: Record<TransactionType, { label: string; icon: IoniconName; color: string }> = {
  CR: { label: 'Income', icon: 'trending-up-outline', color: '#6BD498' },
  DR: { label: 'Expense', icon: 'trending-down-outline', color: '#EF4444' },
};

export function TransactionEditModal({
  visible,
  transaction,
  mode = 'edit',
  presentation = 'modal',
  onClose,
  onSaved,
}: Props) {
  const { colors } = useTheme();
  const { profile } = useSettings();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const accounts = React.useMemo(
    () => (accountsQuery.data ?? []) as Account[],
    [accountsQuery.data]
  );
  const categories = React.useMemo(
    () => (categoriesQuery.data ?? []) as Category[],
    [categoriesQuery.data]
  );

  // ── Form state ──────────────────────────────────────────
  const [type, setType] = React.useState<TransactionType>('DR');
  const [amountInput, setAmountInput] = React.useState('');
  const [note, setNote] = React.useState('');
  const [selectedAccountId, setSelectedAccountId] = React.useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | null>(null);
  const [datetime, setDatetime] = React.useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);

  const isCreateMode = mode === 'create';

  // Pre-fill when transaction prop changes or reset for create mode
  React.useEffect(() => {
    if (!visible) return;
    if (!isCreateMode && transaction) {
      setType(transaction.type);
      setAmountInput(transaction.amount.toString());
      setNote(transaction.note);
      setSelectedAccountId(transaction.accountId);
      setSelectedCategoryId(transaction.categoryId);
      setDatetime(new Date(transaction.datetime));
      return;
    }

    setType('DR');
    setAmountInput('');
    setNote('');
    setSelectedAccountId(null);
    setSelectedCategoryId(null);
    setDatetime(new Date());
  }, [visible, transaction, isCreateMode]);

  React.useEffect(() => {
    if (!visible || !isCreateMode) return;
    if (accounts.length === 0) {
      setSelectedAccountId(null);
      return;
    }

    if (selectedAccountId === null || !accounts.some((account) => account.id === selectedAccountId)) {
      const preferred = accounts.find((account) => account.isDefault) ?? accounts[0];
      setSelectedAccountId(preferred.id);
    }
  }, [visible, isCreateMode, accounts, selectedAccountId]);

  const filteredCategories = React.useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  React.useEffect(() => {
    if (!visible || !isCreateMode) return;
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
  }, [visible, isCreateMode, filteredCategories, selectedCategoryId]);

  // Reset category if type changes and current category doesn't match
  React.useEffect(() => {
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat && cat.type !== type) {
      setSelectedCategoryId(null);
    }
  }, [type, categories, selectedCategoryId]);

  const amountValue = React.useMemo(() => parseAmount(amountInput), [amountInput]);
  const canSave =
    amountValue > 0 &&
    selectedAccountId !== null &&
    selectedCategoryId !== null &&
    accounts.length > 0;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? null;

  const formattedDate = React.useMemo(
    () =>
      datetime.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [datetime]
  );

  const formattedTime = React.useMemo(
    () => datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    [datetime]
  );

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) {
      setDatetime((prev) => {
        const next = new Date(date);
        next.setHours(prev.getHours(), prev.getMinutes(), prev.getSeconds());
        return next;
      });
    }
  };

  const handleTimeChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) {
      setDatetime((prev) => {
        const next = new Date(prev);
        next.setHours(date.getHours(), date.getMinutes(), date.getSeconds());
        return next;
      });
    }
  };

  const isSubmitting = createTransaction.isPending || updateTransaction.isPending;

  const handleSave = () => {
    if (!canSave) return;

    const payload = {
      accountId: selectedAccountId!,
      categoryId: selectedCategoryId!,
      amount: amountValue,
      type,
      datetime: datetime.toISOString(),
      note: note.trim() || 'Transaction',
    };

    const onSuccess = () => {
      onSaved?.();
      onClose();
    };

    if (isCreateMode) {
      createTransaction.mutate(payload, { onSuccess });
      return;
    }

    if (!transaction) return;
    updateTransaction.mutate({ id: transaction.id, data: payload }, { onSuccess });
  };

  const typeMeta = TYPE_META[type];

  const isPage = presentation === 'page';

  const sheetContent = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.sheetContainer, isPage && styles.sheetContainerPage]}
    >
      <View style={[styles.sheet, isPage && styles.sheetPage]}>
        {!isPage && <View style={styles.handle} />}

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{isCreateMode ? 'New Transaction' : 'Edit Transaction'}</Text>
            <Text style={styles.headerSub}>
              {isCreateMode
                ? 'Use the same flow as edit for consistency'
                : 'Changes will recalculate account balance'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Ionicons name={isPage ? 'chevron-back' : 'close'} size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* ── Type selector ── */}
          <View style={styles.typeRow}>
            {(['CR', 'DR'] as const).map((t) => {
              const meta = TYPE_META[t];
              const active = type === t;
              const activeColor = t === 'CR' ? colors.success : colors.danger;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    active && { backgroundColor: activeColor + '18', borderColor: activeColor },
                  ]}
                  onPress={() => setType(t)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={meta.icon}
                    size={16}
                    color={active ? activeColor : colors.textMuted}
                  />
                  <Text style={[styles.typeChipText, active && { color: activeColor }]}>
                    {meta.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Amount ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AMOUNT</Text>
            <View style={[styles.amountRow, { borderColor: amountValue > 0 ? typeMeta.color + '60' : colors.border }]}> 
              <Text style={[styles.currencySymbol, { color: amountValue > 0 ? typeMeta.color : colors.textMuted }]}>
                {selectedAccount?.currency ?? profile.defaultCurrency}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: amountValue > 0 ? typeMeta.color : colors.text }]}
                value={amountInput}
                onChangeText={setAmountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ── Account ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
              {accounts.map((acc) => {
                const selected = selectedAccountId === acc.id;
                const accColor = toHexColor(acc.color);
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.pillCard, selected && { borderColor: accColor, backgroundColor: accColor + '14' }]}
                    onPress={() => setSelectedAccountId(acc.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.pillDot, { backgroundColor: accColor }]} />
                    <View>
                      <Text style={[styles.pillTitle, selected && { color: accColor }]}>{acc.name}</Text>
                      <Text style={styles.pillSub}>{acc.currency}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={14} color={accColor} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Note ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTE</Text>
            <View style={styles.noteRow}>
              <Ionicons name="create-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="What was this for?"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                maxLength={120}
              />
            </View>
          </View>

          {/* ── Category ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
              {filteredCategories.map((cat) => {
                const selected = selectedCategoryId === cat.id;
                const catColor = toHexColor(cat.color);
                const iconName = resolveIconName(cat.icon, 'pricetag-outline');
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryPill, selected && { borderColor: catColor, backgroundColor: catColor + '14' }]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.categoryIconWrap, { backgroundColor: catColor + '20' }]}>
                      <Ionicons name={iconName} size={15} color={catColor} />
                    </View>
                    <Text style={[styles.categoryPillText, selected && { color: catColor }]}>
                      {cat.name}
                    </Text>
                    {selected && <Ionicons name="checkmark-circle" size={13} color={catColor} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Date & Time ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DATE & TIME</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={styles.dateTimeBtn}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
                <Text style={styles.dateTimeBtnText}>{formattedDate}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateTimeBtn}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="time-outline" size={15} color={colors.textMuted} />
                <Text style={styles.dateTimeBtnText}>{formattedTime}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              value={datetime}
              mode="date"
              display="inline"
              maximumDate={new Date()}
              onChange={handleDateChange}
              style={{ marginHorizontal: -4 }}
            />
          )}
          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={datetime}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          )}
          {Platform.OS === 'ios' && showTimePicker && (
            <DateTimePicker
              value={datetime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
          {Platform.OS === 'android' && showTimePicker && (
            <DateTimePicker
              value={datetime}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </ScrollView>

        {/* ── Save button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, (!canSave || isSubmitting) && styles.saveBtnDisabled]}
            onPress={handleSave}
            activeOpacity={0.9}
            disabled={!canSave || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={colors.background} />
                <Text style={styles.saveBtnText}>{isCreateMode ? 'Create Transaction' : 'Save Changes'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  if (isPage) {
    return <View style={[styles.overlay, styles.overlayPage]}>{sheetContent}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        {sheetContent}
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    overlayPage: {
      backgroundColor: 'transparent',
    },
    sheetContainer: {
      maxHeight: '92%',
    },
    sheetContainerPage: {
      maxHeight: '100%',
      flex: 1,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingTop: 12,
    },
    sheetPage: {
      flex: 1,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderTopWidth: 0,
      paddingTop: Platform.OS === 'ios' ? 60 : 22,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.textMuted + '44',
      marginBottom: 8,
    },

    /* Header */
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    headerTitle: {
      fontFamily: typography.fonts.heading,
      fontSize: 24,
      color: colors.text,
      letterSpacing: -0.6,
    },
    headerSub: {
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Body */
    body: { flexGrow: 0 },
    bodyContent: {
      paddingHorizontal: 24,
      paddingBottom: 12,
      gap: 20,
    },

    /* Type selector */
    typeRow: {
      flexDirection: 'row',
      gap: 10,
    },
    typeChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    typeChipText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
      color: colors.textMuted,
    },

    /* Section */
    section: { gap: 10 },
    sectionLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      letterSpacing: 1.3,
      color: colors.textMuted,
    },

    /* Amount */
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      paddingHorizontal: 16,
    },
    currencySymbol: {
      fontFamily: typography.fonts.semibold,
      fontSize: 18,
    },
    amountInput: {
      flex: 1,
      fontFamily: typography.fonts.heading,
      fontSize: 28,
      letterSpacing: -0.5,
    },

    /* Pills row */
    pillsRow: {
      flexDirection: 'row',
      gap: 10,
      paddingRight: 4,
    },
    pillCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    pillDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    pillTitle: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
    },
    pillSub: {
      fontFamily: typography.fonts.regular,
      fontSize: 11,
      color: colors.textMuted,
    },

    /* Note */
    noteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
    },
    noteInput: {
      flex: 1,
      fontFamily: typography.fonts.regular,
      fontSize: 14,
      color: colors.text,
    },

    /* Category pills */
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    categoryIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryPillText: {
      fontFamily: typography.fonts.medium,
      fontSize: 13,
      color: colors.text,
    },

    /* Date & Time */
    dateTimeRow: { flexDirection: 'row', gap: 10 },
    dateTimeBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateTimeBtnText: {
      fontFamily: typography.fonts.medium,
      fontSize: 12,
      color: colors.text,
      flex: 1,
      flexWrap: 'wrap',
    },

    /* Footer */
    footer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      height: 54,
      borderRadius: 16,
      backgroundColor: colors.text,
    },
    saveBtnDisabled: {
      opacity: 0.4,
    },
    saveBtnText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 15,
      color: colors.background,
    },
  });
