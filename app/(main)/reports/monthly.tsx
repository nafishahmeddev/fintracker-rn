import { Ionicons } from '@expo/vector-icons';
import { resolveIcon } from '@/src/utils/icons';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../../src/components/ui/BlurBackground';
import { MetricCard } from '../../../src/features/reports/components/MetricCard';
import { ReportHeader } from '../../../src/features/reports/components/ReportHeader';
import { useMonthlyReport } from '../../../src/features/reports/hooks/useReports';
import { useSettings } from '../../../src/providers/SettingsProvider';
import { useTheme } from '../../../src/providers/ThemeProvider';
import { ThemeColors } from '../../../src/theme/colors';
import { TYPOGRAPHY } from '../../../src/theme/typography';
import { MoneyText } from '../../../src/components/ui/MoneyText';
import { PremiumGuard } from '../../../src/components/ui/PremiumGuard';

/**
 * MonthlyReport: Re-aligned with the Editorial Hero pattern.
 * Focuses on holistic financial audit and progress tracking.
 */
export default function MonthlyReport() {
  const { colors } = useTheme();
  const { profile } = useSettings();
  const { data: report, isLoading } = useMonthlyReport(profile.defaultCurrency);
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) return null;

  const isHealthy = report.savingsRate >= 20;

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />
      <ReportHeader 
        title="Monthly Ledger" 
        subtitle={report.periodLabel} 
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PremiumGuard label="Unlock Monthly Ledgers" size="large">
          {/* ── Editorial Hero ── */}
          <View style={styles.heroSection}>
            <Text style={styles.heroKicker}>MONTHLY AUDIT</Text>
            <Text style={styles.heroTitle}>
              {isHealthy ? 'Solid Accumulation.' : 'Increased Burn.'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Financial state for {report.periodLabel.toLowerCase()} shows a {report.savingsRate.toFixed(1)}% savings rate. 
              {isHealthy ? ' You are building wealth efficiently.' : ' Monitor your discretionary sectors closely.'}
            </Text>
          </View>

          {/* ── Core Month Metrics ── */}
          <View style={styles.metricGrid}>
            <MetricCard 
              label="REVENUE" 
              value={report.totalIncome} 
              currency={profile.defaultCurrency} 
              trendMode="high_is_good"
            />
            <MetricCard 
              label="EXPENSE" 
              value={report.totalExpense} 
              currency={profile.defaultCurrency} 
              trendMode="low_is_good"
            />
          </View>

          <View style={[styles.metricGrid, { marginTop: 12 }]}>
            <MetricCard 
              label="NET POSITION" 
              value={report.netPosition} 
              currency={profile.defaultCurrency} 
              trendMode="high_is_good"
            />
            <MetricCard 
              label="SAVINGS RATE" 
              value={report.savingsRate} 
              currency={profile.defaultCurrency} 
              isAmount={false}
              suffix="%"
              trendMode="high_is_good"
            />
          </View>


          {/* ── Dominant Sectors ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DOMINANT SECTORS</Text>
            <View style={styles.settingsCard}>
              {report.topCategories.length > 0 ? report.topCategories.map((cat, index) => (
                <View key={cat.id} style={[styles.catRow, index === report.topCategories.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.catMeta}>
                    <View style={[styles.catIconBox, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={resolveIcon(cat.icon, 'pricetag')} size={14} color={cat.color} />
                    </View>
                    <View style={styles.catText}>
                      <Text style={styles.catName}>{cat.name}</Text>
                      <View style={styles.progressContainer}>
                         <View style={[styles.progressFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                    <MoneyText amount={cat.amount} currency={profile.defaultCurrency} style={styles.catAmount} weight="semibold" />
                  </View>
                </View>
              )) : (
                <View style={styles.emptyActivity}>
                  <Text style={styles.emptyText}>No sector data available.</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.brandingBox}>
            <Text style={styles.brandingText}>LUNO / SYSTEM ARCHIVE</Text>
          </View>
        </PremiumGuard>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginTop: 8,
    marginBottom: 28,
  },
  heroKicker: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: TYPOGRAPHY.fonts.headingRegular,
    fontSize: 40,
    lineHeight: 44,
    color: colors.text,
    letterSpacing: -2,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    maxWidth: '90%',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  section: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 14,
    opacity: 0.8,
  },
  settingsCard: {
    borderRadius: 20,
    backgroundColor: colors.surface + '80',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  catRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catText: {
    flex: 1,
    gap: 8,
  },
  catName: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  catAmount: {
    fontSize: 14,
  },
  progressContainer: {
    height: 3,
    backgroundColor: colors.text + '08',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyActivity: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  brandingBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandingText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    color: colors.text + '20',
    letterSpacing: 3,
  },
});
