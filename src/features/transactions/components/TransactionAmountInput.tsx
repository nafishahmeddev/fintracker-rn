import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';

type Props = {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  colors: ThemeColors;
};

export const TransactionAmountInput = ({ value, onChange, currency, colors }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>AMOUNT</Text>
      <View style={styles.inputRow}>
        <Text style={[styles.currency, { color: colors.textMuted }]}>{currency}</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textMuted + '40'}
          autoFocus
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  label: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  currency: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fonts.medium,
  },
  input: {
    flex: 1,
    fontSize: 48,
    fontFamily: TYPOGRAPHY.fonts.bold,
    letterSpacing: -1,
  },
});
