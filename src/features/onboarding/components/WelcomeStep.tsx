import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../../theme/typography';

export function WelcomeStep() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.badge}>
        <Ionicons name="sparkles-outline" size={16} color={colors.background} />
        <Text style={styles.badgeText}>LOCAL-FIRST MONEY OS</Text>
      </View>

      <Text style={styles.title}>LUNO.</Text>
      <Text style={styles.body}>
        Clean structure, fast capture, and calm control. This setup gives you a complete first account and a clear taxonomy to start with.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>DEFAULTS</Text>
          <Text style={styles.statValue}>PROFILE + CURRENCY</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>BOOTSTRAP</Text>
          <Text style={styles.statValue}>ACCOUNT + CATEGORIES</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      justifyContent: 'space-between',
      minHeight: 380,
    },
    badge: {
      alignSelf: 'flex-start',
      height: 34,
      borderRadius: 999,
      paddingHorizontal: 12,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badgeText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 11,
      color: colors.background,
      letterSpacing: 0.8,
    },
    title: {
      marginTop: 18,
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 44,
      lineHeight: 46,
      color: colors.text,
      letterSpacing: -1.6,
    },
    body: {
      marginTop: 14,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 15,
      lineHeight: 24,
      color: colors.textMuted,
      maxWidth: 320,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 24,
    },
    statCard: {
      flex: 1,
      paddingVertical: 6,
    },
    statLabel: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 10,
      color: colors.textMuted,
      letterSpacing: 1.1,
      marginBottom: 8,
    },
    statValue: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
  });
