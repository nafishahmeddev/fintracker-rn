import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { ThemeColors } from '../../../theme/colors';
import { TYPOGRAPHY } from '../../../theme/typography';

interface ReportHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * ReportHeader: Editorial-style header for reports with a back button.
 * Aligns with the journalistic aesthetic.
 */
export function ReportHeader({ title, subtitle }: ReportHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
});
