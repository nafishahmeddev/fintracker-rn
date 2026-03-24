import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CurrencyPickerModal } from '../../../components/ui/CurrencyPickerModal';
import { Input } from '../../../components/ui/Input';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { Account } from '../api/accounts';
import { useCreateAccount, useUpdateAccount } from '../hooks/accounts';

export type AccountFormModalProps = {
  visible: boolean;
  onClose: () => void;
  account?: Account;
};

const COLORS = [
  '#00FFAA',
  '#00F0FF',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#EAB308',
  '#F97316',
  '#10B981',
  '#3B82F6',
  '#64748B',
  '#14B8A6',
  '#F59E0B',
] as const;

export function AccountFormModal({ visible, onClose, account }: AccountFormModalProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!account;
  const swatchSize = useMemo(() => Math.max(38, Math.floor((width - 24 * 2 - 8 * 5) / 6)), [width]);

  const { mutateAsync: createAccount } = useCreateAccount();
  const { mutateAsync: updateAccount } = useUpdateAccount();

  const [name, setName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<string>('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [colorHex, setColorHex] = useState<string>(COLORS[0]);

  useEffect(() => {
    if (!visible) return;

    if (account) {
      setName(account.name);
      setHolderName(account.holderName);
      setAccountNumber(account.accountNumber);
      setCurrency(account.currency);
      setColorHex(`#${account.color.toString(16).padStart(6, '0').toUpperCase()}`);
      return;
    }

    setName('');
    setHolderName('');
    setAccountNumber('');
    setBalance('');
    setCurrency('USD');
    setColorHex(COLORS[0]);
  }, [account, visible]);

  const handleSave = async () => {
    if (!name.trim()) return;

    const payload = {
      name: name.trim(),
      holderName: holderName.trim(),
      accountNumber: accountNumber.trim(),
      balance: balance.trim() ? parseFloat(balance) : 0,
      currency,
      color: parseInt(colorHex.replace('#', ''), 16),
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
  };

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
              <Input value={name} onChangeText={setName} placeholder="Main Wallet" autoFocus={!isEditing} style={styles.formInput} />

              <Text style={[styles.label, styles.labelSpaced]}>Holder Name</Text>
              <Input value={holderName} onChangeText={setHolderName} placeholder="Account Holder" style={styles.formInput} />

              <Text style={[styles.label, styles.labelSpaced]}>Account Number</Text>
              <Input value={accountNumber} onChangeText={setAccountNumber} placeholder="IBAN / Account Number" style={styles.formInput} />

              {!isEditing && (
                <>
                  <Text style={[styles.label, styles.labelSpaced]}>Opening Balance</Text>
                  <Input value={balance} onChangeText={setBalance} placeholder="0.00" keyboardType="decimal-pad" style={styles.formInput} />
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

            <View style={[styles.section, styles.sectionLast]}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorGrid}>
                {COLORS.map((item) => (
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
              style={[styles.primaryBtn, !name.trim() && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={!name.trim()}
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
      width: 42,
      height: 4,
      borderRadius: 999,
      marginTop: 10,
      backgroundColor: colors.textMuted + '55',
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 20,
    },
    sectionLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    label: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.4,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    labelSpaced: {
      marginTop: 16,
    },
    formInput: {
      height: 58,
    },
    currencySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 48,
      paddingHorizontal: 14,
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
      fontFamily: typography.fonts.semibold,
      fontSize: 14,
      color: colors.text,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    colorCell: {
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    colorCellActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.05 }],
    },
    footer: {
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: Platform.OS === 'ios' ? 36 : 22,
    },
    primaryBtn: {
      height: 58,
      borderRadius: 18,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
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
