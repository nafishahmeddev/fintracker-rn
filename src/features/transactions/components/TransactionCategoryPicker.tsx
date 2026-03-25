import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import type { Category } from '../../categories/api/categories';

type Props = {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  colors: ThemeColors;
};

const toHexColor = (value: number) => `#${value.toString(16).padStart(6, '0')}`;

const resolveIconName = (raw: string | null | undefined): keyof typeof Ionicons.glyphMap => {
  if (raw && raw in Ionicons.glyphMap) return raw as keyof typeof Ionicons.glyphMap;
  return 'pricetag-outline';
};

export const TransactionCategoryPicker = ({ categories, selectedId, onSelect, colors }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>CATEGORY</Text>
      <View style={styles.grid}>
        {categories.map((cat) => {
          const selected = selectedId === cat.id;
          const catColor = toHexColor(cat.color);
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selected && { backgroundColor: catColor, borderColor: catColor },
              ]}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={resolveIconName(cat.icon)}
                size={14}
                color={selected ? colors.background : catColor}
              />
              <Text
                style={[
                  styles.name,
                  { color: selected ? colors.background : colors.text },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  label: {
    fontFamily: typography.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  name: {
    fontFamily: typography.fonts.medium,
    fontSize: 13,
  },
});
