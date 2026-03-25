import { Ionicons } from '@expo/vector-icons';
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
  TouchableOpacity,
  View
} from 'react-native';
import { CurrencyPickerModal } from '../../../components/ui/CurrencyPickerModal';
import { Input } from '../../../components/ui/Input';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '../../../constants/picker';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { Account } from '../api/accounts';
import { useCreateAccount, useUpdateAccount } from '../hooks/accounts';

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
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!account;
  const swatchSize = 48;

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
      balance: data.balance.trim() ? parseFloat(data.balance) : 0,
      currency,
      color: parseInt(colorHex.replace('#', ''), 16),
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
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

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.label}>Account Name</Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Account name is required' }}
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Main Wallet"
                    autoFocus={!isEditing}
                    style={styles.formInput}
                    error={errors.name?.message}
                  />
                )}
              />

              <Text style={[styles.label, styles.labelSpaced]}>Holder Name</Text>
              <Controller
                control={control}
                name="holderName"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Account Holder"
                    style={styles.formInput}
                  />
                )}
              />

              <Text style={[styles.label, styles.labelSpaced]}>Account Number</Text>
              <Controller
                control={control}
                name="accountNumber"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="IBAN / Account Number"
                    style={styles.formInput}
                  />
                )}
              />

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
                      <Input
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        style={styles.formInput}
                        error={errors.balance?.message}
                      />
                    )}
                  />
                </>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Currency</Text>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => setShowCurrencyPicker(true)}
                activeOpacity={0.85}
              >
                <View style={styles.currencySelectorLeft}>
                  <View style={styles.currencyCodeWrap}>
                    <Text style={styles.currencyCodeText}>{currency}</Text>
                  </View>
                  <Text style={styles.currencySelectorValue}>{currency}</Text>
                </View>
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Icon</Text>
              <View style={styles.colorGrid}>
                {ACCOUNT_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.9}
                    onPress={() => setIconKey(item)}
                    style={[
                      styles.iconCell,
                      { width: swatchSize, height: swatchSize },
                      iconKey === item && styles.iconCellActive,
                    ]}
                  >
                    <Ionicons name={item as any} size={18} color={iconKey === item ? colorHex : colors.textMuted} />
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
                      { backgroundColor: item, width: swatchSize, height: swatchSize },
                      colorHex === item && styles.colorCellActive,
                    ]}
                  >
                    {colorHex === item ? <Ionicons name="checkmark" size={13} color="#FFF" /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
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
      </KeyboardAvoidingView>

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
      fontFamily: typography.fonts.heading,
      fontSize: 30,
      color: colors.text,
      letterSpacing: -1,
    },
    subtitle: {
      fontFamily: typography.fonts.regular,
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
      fontFamily: typography.fonts.semibold,
      fontSize: 9,
      color: colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    labelSpaced: {
      marginTop: 18,
    },
    formInput: {
      height: 56,
    },
    currencySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 56,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencySelectorLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    currencyCodeWrap: {
      height: 28,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary + '40',
      alignItems: 'center',
      justifyContent: 'center',
    },
    currencyCodeText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 11,
      color: colors.primary,
      letterSpacing: 0.5,
    },
    currencySelectorValue: {
      fontFamily: typography.fonts.regular,
      fontSize: 15,
      color: colors.text,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorCell: {
      width: 30,
      height: 30,
      borderRadius: 100,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.1 }],
    },
    iconCell: {
      width: 48,
      height: 48,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.text + '10',
      backgroundColor: colors.background + 'B8',
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconCellActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22,
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
      fontFamily: typography.fonts.heading,
      fontSize: 14,
      color: '#FFFFFF',
      letterSpacing: 0.3,
      marginRight: 10,
    },
  });
