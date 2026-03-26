import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { MoneyText } from './MoneyText';

type TransactionData = {
  id: number;
  type: 'CR' | 'DR';
  amount: number;
  note: string;
  datetime: string;
  account: {
    name: string;
    currency: string;
  };
  category: {
    name: string;
    icon: string;
    color: number;
  };
};

type Props = {
  tx: TransactionData;
  colors: ThemeColors;
  onPress?: (tx: TransactionData) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showDate?: boolean;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

export const TransactionRow = ({ tx, colors, onPress, isFirst, isLast, showDate }: Props) => {
  const categoryColor = toHexColor(tx.category.color);
  const iconName: keyof typeof Ionicons.glyphMap =
    tx.category.icon in Ionicons.glyphMap
      ? (tx.category.icon as keyof typeof Ionicons.glyphMap)
      : 'pricetag-outline';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
          borderTopLeftRadius: isFirst ? 18 : 0,
          borderTopRightRadius: isFirst ? 18 : 0,
          borderBottomLeftRadius: isLast ? 18 : 0,
          borderBottomRightRadius: isLast ? 18 : 0,
        },
      ]}
      activeOpacity={0.78}
      onPress={() => onPress?.(tx)}
    >
      <View
        style={[
          styles.accentBar,
          { backgroundColor: tx.type === 'CR' ? colors.success : colors.danger },
        ]}
      />
      <View
        style={[
          styles.iconBox,
          { backgroundColor: categoryColor + '20' },
        ]}
      >
        <Ionicons name={iconName} size={18} color={categoryColor} />
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.text }]}
          numberOfLines={1}
        >
          {tx.note || tx.category.name}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.dot, { backgroundColor: categoryColor }]} />
          <Text
            style={[styles.meta, { color: colors.textMuted }]}
            numberOfLines={1}
          >
            {tx.category.name} · {tx.account.name}
          </Text>
        </View>
      </View>
      <View style={styles.right}>
        <MoneyText
          amount={tx.amount}
          currency={tx.account.currency}
          type={tx.type}
          weight="bold"
          style={styles.amount}
        />
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {showDate 
            ? new Date(tx.datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : new Date(tx.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingRight: 14,
    gap: 10,
  },
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 999,
    marginLeft: 4,
    marginVertical: 6,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  meta: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  amount: {
    fontSize: 14,
  },
  date: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 11,
  },
});
