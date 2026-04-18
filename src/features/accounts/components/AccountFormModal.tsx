import { Ionicons } from '@expo/vector-icons';
import { resolveIcon } from '../../../utils/icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CurrencyPickerModal } from '../../../components/ui/CurrencyPickerModal';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '../../../constants/picker';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { Account } from '../api/accounts';
import { useCreateAccount, useUpdateAccount } from '../hooks/accounts';
import { parseAmount, toDbColor } from '../../../utils/format';

type AccountFormValues = {
  name: string;
  holderName: string;
  accountNumber: string;
  balance: string;
};

export type AccountFormModalProps = {
  visible: boolean;
  onClose: () => void;
  account?: Account;
};

export function AccountFormModal({ visible, onClose, account }: AccountFormModalProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!account;
  const ModalWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View;

  const { mutateAsync: createAccount } = useCreateAccount();
  const { mutateAsync: updateAccount } = useUpdateAccount();

  const [currency, setCurrency] = useState<string>('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [colorHex, setColorHex] = useState<string>(ACCOUNT_COLORS[0]);
  const [iconKey, setIconKey] = useState<string>(ACCOUNT_ICONS[0]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AccountFormValues>({
    mode: 'onChange',
    defaultValues: { name: '', holderName: '', accountNumber: '', balance: '' },
  });

  useEffect(() => {
    if (!visible) return;

    if (account) {
      reset({
        name: account.name,
        holderName: account.holderName,
        accountNumber: account.accountNumber,
        balance: '',
      });
      setCurrency(account.currency);
      setColorHex(`#${account.color.toString(16).padStart(6, '0').toUpperCase()}`);
      // Re-attach '-outline' suffix so it matches the picker values
      const matchedIcon = ACCOUNT_ICONS.find((i) => i === `${account.icon}-outline`) ?? ACCOUNT_ICONS[0];
      setIconKey(matchedIcon);
      return;
    }

    reset({ name: '', holderName: '', accountNumber: '', balance: '' });
    setCurrency('USD');
    setColorHex(ACCOUNT_COLORS[0]);
    setIconKey(ACCOUNT_ICONS[0]);
  }, [account, visible, reset]);

  const handleSave = handleSubmit(async (data) => {
    const payload = {
      name: data.name.trim(),
      holderName: data.holderName.trim(),
      accountNumber: data.accountNumber.trim(),
      balance: parseAmount(data.balance),
      currency,
      color: toDbColor(colorHex),
      icon: iconKey.replace('-outline', ''),
    };

    try {
      if (isEditing && account) {
        await updateAccount({ id: account.id, data: payload });
      } else {
        await createAccount(payload);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save account:', error);
    }
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ModalWrapper
        style={styles.overlay}
        {...(Platform.OS === 'ios' ? { behavior: 'padding' as const, keyboardVerticalOffset: 0 } : {})}
      >
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

        <View style={styles.sheet}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={[styles.glow, { top: -70, left: -70, width: 330, height: 330, backgroundColor: colors.primary + '2E' }]} />
            <View style={[styles.glow, { top: 260, right: -140, width: 480, height: 480, backgroundColor: colors.text + '0E' }]} />
            <View style={[styles.glow, { bottom: -90, left: 40, width: 320, height: 320, backgroundColor: colors.primary + '1C' }]} />
          </View>

          <BlurView
            blurAmount={Platform.OS === 'ios' ? 80 : 96}
            blurType={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFillObject}
          />

          {Platform.OS === 'android' && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]}
            />
          )}

          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{isEditing ? 'Edit Account' : 'New Account'}</Text>
              <Text style={styles.subtitle}>Configure where your money lives</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.label}>Account Name</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Account name is required' }}
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Main Wallet"
                    placeholderTextColor={colors.textMuted + '50'}
                    autoFocus={!isEditing}
                    style={styles.answerInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
              <View style={[styles.answerLine, errors.name && styles.answerLineError]} />

              <Text style={[styles.label, styles.labelSpaced]}>Holder Name</Text>
              <Controller
                control={control}
                name="holderName"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Account Holder"
                    placeholderTextColor={colors.textMuted + '50'}
                    style={styles.answerInput}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                )}
              />
              <View style={styles.answerLine} />

              <Text style={[styles.label, styles.labelSpaced]}>Account Number</Text>
              <Controller
                control={control}
                name="accountNumber"
                render={({ field }) => (
                  <TextInput
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="IBAN / Account Number"
                    placeholderTextColor={colors.textMuted + '50'}
                    style={styles.answerInput}
                    autoCorrect={false}
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                )}
              />
              <View style={styles.answerLine} />

              {!isEditing && (
                <>
                  <Text style={[styles.label, styles.labelSpaced]}>Opening Balance</Text>
                  <Controller
                    control={control}
                    name="balance"
                    rules={{
                      validate: (v) =>
                        !v.trim() || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0) || 'Enter a valid amount',
                    }}
                    render={({ field }) => (
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        placeholderTextColor={colors.textMuted + '50'}
                        keyboardType="decimal-pad"
                        style={[styles.answerInput, styles.answerInputAmount]}
                        returnKeyType="done"
                      />
                    )}
                  />
                  <View style={[styles.answerLine, errors.balance && styles.answerLineError]} />
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Currency</Text>
              <TouchableOpacity
                style={styles.currencyRow}
                onPress={() => setShowCurrencyPicker(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.currencyValue}>{currency}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.answerLine} />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Icon</Text>
              <View style={styles.iconGrid}>
                {ACCOUNT_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIconKey(item)}
                    style={[
                      styles.iconCell,
                      iconKey === item && { backgroundColor: colorHex, borderColor: colorHex },
                      iconKey === item && styles.iconCellActive,
                    ]}
                  >
                    <Ionicons name={resolveIcon(item, 'wallet-outline')} size={18} color={iconKey === item ? '#000100' : colors.text} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.sectionLast]}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {ACCOUNT_COLORS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setColorHex(item)}
                    style={[
                      styles.colorCell,
                      { backgroundColor: item },
                      colorHex === item && styles.colorCellActive,
                    ]}
                  >
                    {colorHex === item ? <Ionicons name="checkmark" size={14} color="#000100" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View
            style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, Platform.OS === 'ios' ? 36 : 22) }]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!isValid}
            >
              <Text style={styles.primaryBtnText}>{isEditing ? 'Save Account' : 'Create Account'}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </ModalWrapper>

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        value={currency}
        onChange={(code) => setCurrency(code)}
      />
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      height: '86%',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderTopWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    glow: {
      position: 'absolute',
      borderRadius: 999,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 3,
      borderRadius: 999,
      marginTop: 12,
      marginBottom: 8,
      backgroundColor: colors.textMuted + '44',
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 6,
      paddingBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 30,
      color: colors.text,
      letterSpacing: -1,
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    closeBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 20,
    },
    scroll: {
      flex: 1,
    },
    section: {
      paddingBottom: 22,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 22,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.textMuted,
      letterSpacing: 0.1,
      marginBottom: 6,
    },
    labelSpaced: {
      marginTop: 16,
    },
    answerInput: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
      paddingHorizontal: 0,
      paddingVertical: 4,
    },
    answerInputAmount: {
      fontFamily: TYPOGRAPHY.fonts.amountBold,
      letterSpacing: 0,
    },
    answerLine: {
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.primary + '55',
      marginTop: 4,
    },
    answerLineError: {
      backgroundColor: colors.danger + '88',
    },
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    currencyValue: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 28,
      lineHeight: 34,
      color: colors.text,
      letterSpacing: -0.7,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorCell: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.08 }],
    },
    iconCell: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: colors.text + '10',
      backgroundColor: colors.background + 'B8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCellActive: {},
    footer: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22,
      backgroundColor: colors.background + 'F2',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    primaryBtn: {
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 5,
    },
    primaryBtnDisabled: {
      opacity: 0.45,
    },
    primaryBtnText: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      marginRight: 10,
    },
  });
