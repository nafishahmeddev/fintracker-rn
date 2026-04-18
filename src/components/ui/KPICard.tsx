import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius } from '../../theme/tokens';
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

/**
 * KPICard - Editorial Brutalist Design
 * 
 * Structure:
 * - Card: 16px radius (lg), 16px padding, surface background
 * - Currency tabs: 12px radius (md), 8px gap
 * - Labels: Uppercase, 9-10px, letterSpacing 1.2
 * - Values: 24px large / 14px small
 */
export const KPICard = React.memo(function KPICard({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  metrics,
  colors
}: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleCurrencyPress = useCallback((curr: string) => {
    onSelectCurrency(curr);
  }, [onSelectCurrency]);

  return (
    <View style={styles.kpiCard}>
      {currencies.length > 1 && (
        <View style={styles.kpiTabsWrap}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.currencyTabsRow}
          >
            {currencies.map((cur) => (
              <TouchableOpacity
                key={cur}
                style={[
                  styles.currencyTab,
                  selectedCurrency === cur && styles.currencyTabActive,
                ]}
                onPress={() => handleCurrencyPress(cur)}
                activeOpacity={0.75}
              >
                <Text style={[
                  styles.currencyTabText,
                  selectedCurrency === cur && styles.currencyTabTextActive,
                ]}>
                  {cur}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={styles.kpiBody}>
        {/* Top: Net Balance */}
        <View style={styles.kpiMainContent}>
          <View>
            <Text style={styles.kpiLabel}>NET SAVINGS</Text>
            <MoneyText
              amount={Math.abs(metrics.income - metrics.expense)}
              currency={selectedCurrency ?? undefined}
              type={metrics.income >= metrics.expense ? 'CR' : 'DR'}
              weight="bold"
              style={styles.kpiValueLarge}
            />
          </View>
        </View>

        <View style={styles.kpiDivider} />

        {/* Bottom: In/Out Split */}
        <View style={styles.kpiSecondaryContent}>
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabelSmall}>INCOME</Text>
            <MoneyText
              amount={metrics.income}
              currency={selectedCurrency ?? undefined}
              type="CR"
              weight="semibold"
              style={styles.kpiValueSmall}
            />
          </View>
          <View style={styles.kpiVerticalSep} />
          <View style={styles.kpiCell}>
            <Text style={styles.kpiLabelSmall}>EXPENSES</Text>
            <MoneyText
              amount={metrics.expense}
              currency={selectedCurrency ?? undefined}
              type="DR"
              weight="semibold"
              style={styles.kpiValueSmall}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    kpiCard: {
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    kpiTabsWrap: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: spacing('2'),
      paddingLeft: spacing('3'),
    },
    currencyTabsRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      paddingRight: spacing('3'),
    },
    currencyTab: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('2'),
      borderRadius: radius('full'),
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
    kpiBody: {
      padding: spacing('4'),
      paddingBottom: spacing('4'),
      gap: spacing('3'),
    },
    kpiMainContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kpiSecondaryContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    kpiCell: {
      flex: 1,
      gap: spacing('0.5'),
    },
    kpiVerticalSep: {
      width: 1,
      height: 24,
      backgroundColor: colors.border,
      marginHorizontal: spacing('4'),
      opacity: 0.6,
    },
    kpiLabel: {
      color: colors.textMuted,
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 9,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: spacing('0.5'),
    },
    kpiLabelSmall: {
      color: colors.textMuted,
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 8,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    kpiValueLarge: {
      fontSize: 24,
      lineHeight: 28,
    },
    kpiValueSmall: {
      fontSize: 14,
      lineHeight: 18,
    },
    kpiDivider: {
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.5,
    },
  });
