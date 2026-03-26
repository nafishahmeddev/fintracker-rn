import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';

type Props = {
  value: 'CR' | 'DR';
  onChange: (value: 'CR' | 'DR') => void;
  colors: ThemeColors;
};

export const TransactionTypePicker = ({ value, onChange, colors }: Props) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'DR' && { backgroundColor: colors.danger, borderColor: colors.danger },
        ]}
        onPress={() => onChange('DR')}
        activeOpacity={0.8}
      >
        <Text style={[styles.pillText, { color: value === 'DR' ? colors.background : colors.textMuted }]}>Expense</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.pill,
          { backgroundColor: colors.surface, borderColor: colors.border },
          value === 'CR' && { backgroundColor: colors.success, borderColor: colors.success },
        ]}
        onPress={() => onChange('CR')}
        activeOpacity={0.8}
      >
        <Text style={[styles.pillText, { color: value === 'CR' ? colors.background : colors.textMuted }]}>Income</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pillText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 13,
  },
});
