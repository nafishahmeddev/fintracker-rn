import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { typography } from '../../../theme/typography';
import { ONBOARDING_CURRENCIES } from '../constants';

type CurrencyStepProps = {
  currency: string;
  onCurrencyChange: (value: string) => void;
};

export function CurrencyStep({ currency, onCurrencyChange }: CurrencyStepProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const selectedCurrency = ONBOARDING_CURRENCIES.find((item) => item.code === currency);

  return (
    <View style={styles.wrapper}>
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>SELECTED DEFAULT</Text>
        <Text style={styles.heroValue}>{selectedCurrency?.name ?? currency}</Text>
        <Text style={styles.heroCode}>{selectedCurrency?.code ?? currency}</Text>
        <Text style={styles.heroSubtext}>Used for the first account and as the app default.</Text>
      </View>

      <View style={styles.chipsWrap}>
        {ONBOARDING_CURRENCIES.map((item) => {
          const selected = currency === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onCurrencyChange(item.code)}
              activeOpacity={0.9}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item.code} · {item.name}</Text>
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
      gap: 14,
    },
    hero: {
      paddingVertical: 4,
    },
    heroLabel: {
      fontFamily: typography.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    heroValue: {
      fontFamily: typography.fonts.heading,
      fontSize: 24,
      color: colors.text,
      letterSpacing: -0.8,
    },
    heroCode: {
      marginTop: 4,
      fontFamily: typography.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    heroSubtext: {
      marginTop: 6,
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    chip: {
      borderRadius: 999,
      minHeight: 42,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background + 'B8',
      borderWidth: 1,
      borderColor: colors.text + '10',
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      fontFamily: typography.fonts.semibold,
      fontSize: 13,
      color: colors.text,
      textAlign: 'center',
    },
    chipTextActive: {
      color: colors.background,
    },
  });
