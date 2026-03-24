import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Input } from '../../../components/ui/Input';
import { useTheme } from '../../../providers/ThemeProvider';
import { typography } from '../../../theme/typography';
import { ONBOARDING_ACCOUNT_COLORS, ONBOARDING_ACCOUNT_ICONS } from '../constants';
import { parseAmount } from '../utils';

type AccountStepProps = {
  accountName: string;
  accountHolder: string;
  accountNumber: string;
  openingBalance: string;
  defaultCurrency: string;
  accountIcon: string;
  accountColor: string;
  profileName: string;
  onAccountNameChange: (value: string) => void;
  onAccountHolderChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onOpeningBalanceChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onColorChange: (value: string) => void;
};

export function AccountStep({
  accountName,
  accountHolder,
  accountNumber,
  openingBalance,
  defaultCurrency,
  accountIcon,
  accountColor,
  profileName,
  onAccountNameChange,
  onAccountHolderChange,
  onAccountNumberChange,
  onOpeningBalanceChange,
  onIconChange,
  onColorChange,
}: AccountStepProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const previewName = accountName.trim() || 'Main Wallet';
  const previewHolder = accountHolder.trim() || profileName.trim() || 'Account Holder';

  return (
    <View style={styles.wrapper}>
      <View style={[styles.previewCard, { borderColor: accountColor + '55' }]}>
        <View style={[styles.previewIconWrap, { backgroundColor: accountColor + '24' }]}>
          <Ionicons name={accountIcon as any} size={20} color={accountColor} />
        </View>
        <View style={styles.previewCopy}>
          <Text style={styles.previewName}>{previewName}</Text>
          <Text style={styles.previewMeta}>{previewHolder} • {defaultCurrency}</Text>
        </View>
        <Text style={styles.previewAmount}>{parseAmount(openingBalance).toFixed(2)}</Text>
      </View>

      <Input label="Account Name" placeholder="Main Wallet" value={accountName} onChangeText={onAccountNameChange} />
      <Input label="Holder Name" placeholder="Account holder" value={accountHolder} onChangeText={onAccountHolderChange} />
      <Input label="Account Number" placeholder="IBAN / Last 4 / Wallet ID" value={accountNumber} onChangeText={onAccountNumberChange} />
      <Input
        label={`Opening Balance (${defaultCurrency})`}
        placeholder="0.00"
        value={openingBalance}
        onChangeText={onOpeningBalanceChange}
        keyboardType="decimal-pad"
      />

      <Text style={styles.selectorLabel}>ACCOUNT ICON</Text>
      <View style={styles.iconWrap}>
        {ONBOARDING_ACCOUNT_ICONS.map((iconName) => {
          const selected = accountIcon === iconName;
          return (
            <TouchableOpacity
              key={iconName}
              style={[styles.iconChip, selected && styles.iconChipActive]}
              onPress={() => onIconChange(iconName)}
              activeOpacity={0.9}
            >
              <Ionicons name={iconName} size={18} color={selected ? colors.background : colors.text} />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.selectorLabel}>ACCOUNT COLOR</Text>
      <View style={styles.colorWrap}>
        {ONBOARDING_ACCOUNT_COLORS.map((swatch) => {
          const selected = accountColor === swatch;
          return (
            <TouchableOpacity
              key={swatch}
              style={[styles.colorChip, { backgroundColor: swatch }, selected && styles.colorChipActive]}
              onPress={() => onColorChange(swatch)}
              activeOpacity={0.9}
            >
              {selected ? <Ionicons name="checkmark" size={14} color="#000100" /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    wrapper: {
      gap: 12,
    },
    previewCard: {
      minHeight: 86,
      borderRadius: 20,
      padding: 14,
      backgroundColor: colors.background + 'CC',
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    previewIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    previewCopy: {
      flex: 1,
      paddingRight: 10,
    },
    previewName: {
      fontFamily: typography.fonts.headingRegular,
      fontSize: 18,
      color: colors.text,
      letterSpacing: -0.3,
    },
    previewMeta: {
      marginTop: 4,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    previewAmount: {
      fontFamily: typography.fonts.amountBold,
      fontSize: 16,
      color: colors.text,
    },
    selectorLabel: {
      marginTop: 2,
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.3,
      marginBottom: 2,
    },
    iconWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    iconChip: {
      width: 46,
      height: 46,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background + 'B8',
      borderWidth: 1,
      borderColor: colors.text + '10',
    },
    iconChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    colorWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorChip: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorChipActive: {
      borderColor: colors.text,
      transform: [{ scale: 1.08 }],
    },
  });
