import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { MoneyText } from './MoneyText';

type KPIMetrics = {
  income: number;
  expense: number;
};

type Props = {
  currencies: string[];
  selectedCurrency: string | null;
  onSelectCurrency: (currency: string) => void;
  metrics: KPIMetrics;
  colors: ThemeColors;
};

export const KPICard = ({ currencies, selectedCurrency, onSelectCurrency, metrics, colors }: Props) => {
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.kpiCard}>
      {currencies.length > 1 && (
        <View style={styles.kpiTabsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyTabsRow}>
            {currencies.map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[styles.currencyTab, selectedCurrency === cur && styles.currencyTabActive]}
                onPress={() => onSelectCurrency(cur)}
                activeOpacity={0.8}
              >
                <Text style={[styles.currencyTabText, selectedCurrency === cur && styles.currencyTabTextActive]}>{cur}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <View style={styles.kpiStrip}>
        <View style={styles.kpiCell}>
          <Text style={styles.kpiLabel}>IN</Text>
          <MoneyText amount={metrics.income} currency={selectedCurrency ?? undefined} type="CR" weight="bold" style={styles.kpiValue} />
        </View>
        <View style={styles.kpiSep} />
        <View style={styles.kpiCell}>
          <Text style={styles.kpiLabel}>OUT</Text>
          <MoneyText amount={metrics.expense} currency={selectedCurrency ?? undefined} type="DR" weight="bold" style={styles.kpiValue} />
        </View>
        <View style={styles.kpiSep} />
        <View style={styles.kpiCell}>
          <Text style={styles.kpiLabel}>NET</Text>
          <MoneyText
            amount={Math.abs(metrics.income - metrics.expense)}
            currency={selectedCurrency ?? undefined}
            type={metrics.income >= metrics.expense ? 'CR' : 'DR'}
            weight="bold"
            style={styles.kpiValue}
          />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    kpiCard: {
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    kpiTabsWrap: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
      paddingLeft: 12,
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 12,
    },
    currencyTab: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 100,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currencyTabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    currencyTabText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 12,
      color: colors.textMuted,
      letterSpacing: 0.3,
    },
    currencyTabTextActive: {
      color: colors.background,
    },
    kpiStrip: {
      flexDirection: 'row',
    },
    kpiCell: {
      flex: 1,
      paddingVertical: 14,
      paddingHorizontal: 12,
      gap: 5,
    },
    kpiSep: {
      width: 1,
      marginVertical: 12,
      backgroundColor: colors.border,
    },
    kpiLabel: {
      color: colors.textMuted,
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      letterSpacing: 1.4,
    },
    kpiValue: {
      fontSize: 15,
      lineHeight: 18,
    },
  });
