import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../../theme/typography';
import { formatCurrency } from '../../../utils/format';
import { DashboardInsight } from '../api/insights';

interface InsightCardProps {
  insight: DashboardInsight;
}

/**
 * InsightCard: An "Editorial Brutalist" card for displaying financial trends.
 * Features:
 * 1. Glassmorphic Surface: Semi-transparent background with sharp borders.
 * 2. Bold Typography: High-contrast headings and value indicators.
 * 3. Icon Branding: Thematic icons based on insight type.
 */
export const InsightCard = React.memo(function InsightCard({ insight }: InsightCardProps) {
  const { colors } = useTheme();

  const status = useMemo(() => {
    switch (insight.type) {
      case 'success': return { bg: colors.success + '15', text: colors.success };
      case 'danger': return { bg: colors.danger + '15', text: colors.danger };
      case 'warning': return { bg: colors.warning + '15', text: colors.warning };
      case 'info': return { bg: colors.primary + '15', text: colors.primary };
      default: return { bg: colors.surface, text: colors.text };
    }
  }, [insight.type, colors.success, colors.danger, colors.warning, colors.primary, colors.surface, colors.text]);

  const displayValue = useMemo(() => {
    switch (insight.valueType) {
      case 'amount':
        return formatCurrency(insight.amount, insight.currency);
      case 'percentage':
        return `${insight.percentage > 0 ? '+' : ''}${insight.percentage.toFixed(0)}%`;
      case 'text':
        return insight.text;
    }
  }, [insight]);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface + '90', borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: status.bg }]}>
          <Ionicons name={insight.icon as any} size={16} color={status.text} />
        </View>
        <Text style={[styles.title, { color: colors.textMuted }]}>{insight.title.toUpperCase()}</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{displayValue}</Text>
        <View style={styles.trendContainer}>
           <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
             {insight.subtitle}
           </Text>
           {insight.trend && (
             <Ionicons 
               name={insight.trend === 'up' ? 'arrow-up' : 'arrow-down'} 
               size={12} 
               color={insight.type === 'danger' ? colors.danger : colors.success} 
               style={styles.trendIcon}
             />
           )}
        </View>
      </View>

      <View style={[styles.accentLine, { backgroundColor: status.text }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 210,
    minHeight: 115,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    marginRight: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    letterSpacing: 1.5,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  value: {
    fontFamily: TYPOGRAPHY.fonts.amountBold,
    fontSize: 24,
    letterSpacing: -1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.2,
    flex: 1,
  },
  trendIcon: {
    marginLeft: 4,
  },
  accentLine: {
    position: 'absolute',
    bottom: -1,
    left: 20,
    right: 20,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.8,
  },
});
