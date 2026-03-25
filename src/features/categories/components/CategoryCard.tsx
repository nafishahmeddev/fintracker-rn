import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../api/categories';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface CategoryCardProps {
  item: Category;
  index: number;
  colors: ThemeColors;
  onPress: (item: Category) => void;
  onLongPress: (item: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  item,
  index,
  colors,
  onPress,
  onLongPress,
}) => {
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const catColor = item.color ? '#' + item.color.toString(16).padStart(6, '0') : colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        index % 2 === 0 ? styles.categoryCardLeft : styles.categoryCardRight,
      ]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      delayLongPress={280}
      activeOpacity={0.92}
    >
      <View style={[styles.cardGlow, { backgroundColor: catColor + '30' }]} />

      <View style={styles.cardTopRow}>
        <View style={[styles.categoryIconBox, { backgroundColor: catColor + '22' }]}> 
          <Ionicons name={item.icon as any || 'grid-outline'} size={20} color={catColor} />
        </View>
        <View style={[styles.typeBadge, item.type === 'DR' ? styles.typeBadgeDanger : styles.typeBadgeSuccess]}>
          <Text style={[styles.typeBadgeText, item.type === 'DR' ? styles.typeBadgeTextDanger : styles.typeBadgeTextSuccess]}>
            {item.type === 'DR' ? 'EXPENSE' : 'INCOME'}
          </Text>
        </View>
      </View>

      <View style={styles.cardMainRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.categorySubtext}>Tap to edit</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Hold for options</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  categoryCard: {
    position: 'relative',
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    overflow: 'hidden',
    minHeight: 156,
  },
  categoryCardLeft: {
    marginRight: 6,
  },
  categoryCardRight: {
    marginLeft: 6,
  },
  cardGlow: {
    position: 'absolute',
    right: -24,
    top: -24,
    width: 88,
    height: 88,
    borderRadius: 999,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    height: 22,
    borderRadius: 999,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadgeDanger: {
    backgroundColor: colors.danger + '18',
  },
  typeBadgeSuccess: {
    backgroundColor: colors.success + '18',
  },
  typeBadgeText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.7,
  },
  typeBadgeTextDanger: {
    color: colors.danger,
  },
  typeBadgeTextSuccess: {
    color: colors.success,
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  categoryName: {
    fontFamily: typography.fonts.headingRegular,
    color: colors.text,
    fontSize: 20,
    letterSpacing: -0.5,
    lineHeight: 23,
  },
  categorySubtext: {
    fontFamily: typography.fonts.regular,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooterText: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
});
