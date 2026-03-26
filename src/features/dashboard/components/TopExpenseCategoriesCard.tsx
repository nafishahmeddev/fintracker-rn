import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoneyText } from '../../../components/ui/MoneyText';
import { useTheme } from '../../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../../theme/typography';

type IoniconName = keyof typeof Ionicons.glyphMap;

type TopExpenseCategory = {
  name: string;
  icon: string;
  color: number;
  amount: number;
};

type TopExpenseCategoriesCardProps = {
  currencies: string[];
  selectedCurrency: string;
  onSelectCurrency: (value: string) => void;
  categories: TopExpenseCategory[];
};

const resolveIconName = (raw: string | null | undefined, fallback: IoniconName): IoniconName => {
  if (raw && raw in Ionicons.glyphMap) return raw as IoniconName;
  if (raw) {
    const outlined = `${raw}-outline`;
    if (outlined in Ionicons.glyphMap) return outlined as IoniconName;
  }
  return fallback;
};

export function TopExpenseCategoriesCard({
  currencies,
  selectedCurrency,
  onSelectCurrency,
  categories,
}: TopExpenseCategoriesCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const maxAmount = React.useMemo(
    () => categories.reduce((max, item) => (item.amount > max ? item.amount : max), 0),
    [categories]
  );

  return (
    <View style={styles.card}>
      {currencies.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {currencies.map((curr) => (
            <TouchableOpacity
              key={curr}
              style={[styles.tab, selectedCurrency === curr && styles.tabActive]}
              onPress={() => onSelectCurrency(curr)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, selectedCurrency === curr && styles.tabTextActive]}>{curr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {categories.length > 0 ? (
        categories.map((category, idx) => {
          const isLast = idx === categories.length - 1;
          const accent = `#${category.color.toString(16).padStart(6, '0')}`;
          const ratio = maxAmount > 0 ? category.amount / maxAmount : 0;
          return (
            <View key={`${category.name}-${idx}`} style={[styles.row, isLast && styles.rowLast]}>
              <View style={styles.left}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{idx + 1}</Text>
                </View>
                <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
                  <Ionicons name={resolveIconName(category.icon, 'pricetag-outline')} size={14} color={accent} />
                </View>
                <View style={styles.meta}>
                  <Text style={styles.name} numberOfLines={1}>{category.name}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(8, ratio * 100)}%`, backgroundColor: accent }]} />
                  </View>
                </View>
              </View>
              <View style={styles.right}>
                <MoneyText amount={category.amount} currency={selectedCurrency} type="DR" weight="bold" style={styles.amount} />
                <Text style={styles.percent}>{`${(ratio * 100).toFixed(0)}%`}</Text>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.empty}>
          <Ionicons name="pie-chart-outline" size={18} color={colors.textMuted} />
          <Text style={styles.emptyText}>No expense data yet for {selectedCurrency}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    card: {
      marginHorizontal: 24,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: 22,
    },
    tabsRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 6,
    },
    tab: {
      height: 26,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background + 'AA',
      paddingHorizontal: 10,
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: colors.text,
      borderColor: colors.text,
    },
    tabText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 11,
      letterSpacing: 0.4,
    },
    tabTextActive: {
      color: colors.background,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    left: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    rankBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background + 'AA',
      borderWidth: 1,
      borderColor: colors.border,
    },
    rankText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.textMuted,
      fontSize: 10,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
    },
    meta: {
      flex: 1,
    },
    name: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      color: colors.text,
      fontSize: 12,
      marginBottom: 5,
    },
    barTrack: {
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.background + 'CC',
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 999,
      minWidth: 8,
    },
    right: {
      minWidth: 88,
      alignItems: 'flex-end',
    },
    amount: {
      fontSize: 13,
      lineHeight: 15,
    },
    percent: {
      marginTop: 3,
      fontFamily: TYPOGRAPHY.fonts.regular,
      color: colors.textMuted,
      fontSize: 10,
    },
    empty: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    emptyText: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      color: colors.textMuted,
      fontSize: 12,
    },
  });
