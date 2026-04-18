import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../src/components/ui/BlurBackground';
import { ReportHeader } from '../../../src/features/reports/components/ReportHeader';
import { StreakBadge } from '../../../src/features/reports/components/StreakBadge';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { ThemeColors } from '../../../src/theme/colors';
import { TYPOGRAPHY } from '../../../src/theme/typography';

/**
 * ReportsHub: Re-aligned with the core Editorial Brutalist design.
 * Uses the settingsCard pattern and standardized typography.
 */
export default function ReportsHub() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const REPORT_TYPES = [
    {
      id: 'weekly',
      title: 'Weekly Journal',
      subtitle: '7-day performance summary',
      icon: 'newspaper-outline' as const,
      route: '/(main)/reports/weekly' as Href,
      color: colors.primary,
    },
    {
      id: 'monthly',
      title: 'Monthly Ledger',
      subtitle: 'Full calendar month audit',
      icon: 'book-outline' as const,
      route: '/(main)/reports/monthly' as Href,
      color: colors.success,
      isLast: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <ReportHeader title="Reports" subtitle="Reflect & Adjust" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR ACTIVITY</Text>
          <View style={styles.streakCard}>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>Persistence</Text>
              <Text style={styles.streakSubtitle}>
                Small daily adjustments lead to massive long-term freedom.
              </Text>
              <View style={{ marginTop: 16 }}>
                <StreakBadge />
              </View>
            </View>
            <View style={styles.streakIconWrap}>
              <Ionicons name="flame" size={80} color={colors.primary + '10'} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HISTORICAL SUMMARIES</Text>
          <View style={styles.settingsCard}>
            {REPORT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.settingsRow, type.isLast && { borderBottomWidth: 0 }]}
                onPress={() => router.push(type.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name={type.icon} size={18} color={colors.text} />
                </View>
                <View style={styles.textDetails}>
                  <Text style={styles.rowTitle}>{type.title}</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>{type.subtitle}</Text>
                </View>
                <View style={styles.rowRightSide}>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.philosophySection}>
            <Text style={styles.philosophyText}>
              LUNO / CORE PHILOSOPHY{"\n"}
              <Text style={{ opacity: 0.4 }}>TRACKING FREQUENCY PREDICTS SUCCESS.</Text>
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 14,
    opacity: 0.8,
  },
  streakCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.surface + '80',
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  streakInfo: {
    flex: 1,
    zIndex: 1,
  },
  streakTitle: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    fontSize: 22,
    color: colors.text,
    marginBottom: 6,
  },
  streakSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    maxWidth: '85%',
  },
  streakIconWrap: {
    position: 'absolute',
    right: -10,
    bottom: -15,
  },
  settingsCard: {
    borderRadius: 20,
    backgroundColor: colors.surface + '80',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 14,
  },
  textDetails: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  rowSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rowRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  philosophySection: {
    marginTop: 40,
    alignItems: 'center',
  },
  philosophyText: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 9,
    color: colors.text,
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 16,
  },
});
