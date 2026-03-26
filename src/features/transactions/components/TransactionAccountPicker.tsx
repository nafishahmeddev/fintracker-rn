import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import type { Account } from '../../accounts/api/accounts';

type Props = {
  accounts: Account[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  colors: ThemeColors;
};

const resolveIconName = (raw: string | null | undefined): keyof typeof Ionicons.glyphMap => {
  if (raw && raw in Ionicons.glyphMap) return raw as keyof typeof Ionicons.glyphMap;
  return 'wallet-outline';
};

export const TransactionAccountPicker = ({ accounts, selectedId, onSelect, colors }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>ACCOUNT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {accounts.map((acc) => {
          const selected = selectedId === acc.id;
          const accColor = '#' + acc.color.toString(16).padStart(6, '0');
          return (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: selected ? accColor : colors.border },
              ]}
              onPress={() => onSelect(acc.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, { backgroundColor: accColor + '15' }]}>
                <Ionicons name={resolveIconName(acc.icon)} size={18} color={accColor} />
              </View>
              <View>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{acc.name}</Text>
                <Text style={[styles.currency, { color: colors.textMuted }]}>{acc.currency}</Text>
              </View>
              {selected && (
                <View style={[styles.check, { backgroundColor: accColor }]}>
                  <Ionicons name="checkmark" size={10} color={colors.background} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  label: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
    paddingVertical: 4
  },
  card: {
    minWidth: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 13,
  },
  currency: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 11,
  },
  check: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});
