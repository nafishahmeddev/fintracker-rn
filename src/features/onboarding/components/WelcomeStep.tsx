import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../../theme/typography';

interface WelcomeStepProps {
  onImportPress?: () => void;
}

export function WelcomeStep({ onImportPress }: WelcomeStepProps) {
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

      {onImportPress && (
        <TouchableOpacity style={styles.importButton} onPress={onImportPress} activeOpacity={0.7}>
          <View style={styles.importIconBox}>
            <Ionicons name="cloud-download-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.importTextContainer}>
            <Text style={styles.importTitle}>Restore from backup</Text>
            <Text style={styles.importSubtitle}>Import your existing data</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
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
    importButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    importIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    importTextContainer: {
      flex: 1,
    },
    importTitle: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
      color: colors.text,
      marginBottom: 2,
    },
    importSubtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
      color: colors.textMuted,
    },
  });
