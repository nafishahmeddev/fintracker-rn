import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';

interface MetricCardProps {
  label: string;
  value: number;
  currency: string;
  type?: 'CR' | 'DR' | 'neutral';
  percentage?: number;
  suffix?: string;
  isAmount?: boolean;
}

/**
 * MetricCard: A key performance indicator card for reports.
 * Used for displaying totals like "Weekly Expense" or "Savings Rate".
 */
export function MetricCard({ 
  label, 
  value, 
  currency, 
  type = 'neutral', 
  percentage, 
  suffix,
  isAmount = true 
}: MetricCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        {isAmount ? (
          <MoneyText 
            amount={value} 
            currency={currency} 
            type={type === 'neutral' ? undefined : type} 
            style={styles.value} 
            weight="bold" 
          />
        ) : (
          <Text style={[styles.value, { color: colors.text }]}>
            {value.toFixed(1)}{suffix}
          </Text>
        )}
      </View>
      {percentage !== undefined && (
        <View style={styles.percentageRow}>
          <Text style={[styles.percentageText, { color: percentage >= 0 ? (type === 'CR' ? colors.success : colors.danger) : (type === 'CR' ? colors.danger : colors.success) }]}>
            {percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}% vs prev.
          </Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface + '80',
    borderWidth: 1,
    borderColor: colors.border, 
    flex: 1,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 22,
    lineHeight: 28,
  },
  percentageRow: {
    marginTop: 8,
  },
  percentageText: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
});
