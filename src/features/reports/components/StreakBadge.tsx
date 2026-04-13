import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';
import { useUsageStreak } from '../hooks/useStreak';

/**
 * StreakBadge: A tiny, high-contrast indicator of usage consistency.
 * Sits on the Dashboard to provide dopamine and retention.
 * Re-aligned with core patterns and properly typed.
 */
export function StreakBadge() {
  const { colors } = useTheme();
  const { data: streak, isLoading } = useUsageStreak();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  if (isLoading || !streak || streak === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.text }]}>
      <Ionicons name="flame" size={10} color={colors.primary} />
      <Text style={[styles.text, { color: colors.background }]}>
        {streak} DAY STREAK
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
});
