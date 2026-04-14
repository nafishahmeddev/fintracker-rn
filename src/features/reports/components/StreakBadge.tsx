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
    <View style={styles.container}>
      <Ionicons name="flame" size={11} color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>
        {streak}D STREAK
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    height: 24, // Matches accountCurrencyBadge exactly
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 4,
    backgroundColor: colors.background + '80', // Translucent dark-mode friendly bg
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: TYPOGRAPHY.fonts.semibold, // Matches currency chip
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
