import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

interface CategoryTypeSelectorProps {
  activeType: 'CR' | 'DR';
  onTypeChange: (type: 'CR' | 'DR') => void;
  colors: ThemeColors;
}

export const CategoryTypeSelector: React.FC<CategoryTypeSelectorProps> = ({
  activeType,
  onTypeChange,
  colors,
}) => {
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.typeTabsRail}>
      <TouchableOpacity
        style={[styles.segmentPill, activeType === 'DR' && styles.segmentPillActive]}
        onPress={() => onTypeChange('DR')}
        activeOpacity={0.9}
      >
        <Ionicons 
          name="arrow-down-circle-outline" 
          size={14} 
          color={activeType === 'DR' ? colors.background : colors.textMuted} 
        />
        <Text style={[styles.segmentPillText, activeType === 'DR' && styles.segmentPillTextActive]}>
          Expenses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.segmentPill, activeType === 'CR' && styles.segmentPillActive]}
        onPress={() => onTypeChange('CR')}
        activeOpacity={0.9}
      >
        <Ionicons 
          name="arrow-up-circle-outline" 
          size={14} 
          color={activeType === 'CR' ? colors.background : colors.textMuted} 
        />
        <Text style={[styles.segmentPillText, activeType === 'CR' && styles.segmentPillTextActive]}>
          Income
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  typeTabsRail: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'D9',
    padding: 4,
    gap: 4,
  },
  segmentPill: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  segmentPillActive: {
    backgroundColor: colors.text,
  },
  segmentPillText: {
    fontFamily: typography.fonts.semibold,
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  segmentPillTextActive: {
    color: colors.background,
  },
});
