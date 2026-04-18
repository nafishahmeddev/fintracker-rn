import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '@/src/components/ui/BlurBackground';
import { SearchScreen } from '@/src/features/search/screens/SearchScreen';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { RADIUS, SPACING } from '@/src/theme/tokens';
import { TYPOGRAPHY } from '@/src/theme/typography';

const SEARCH_FEATURES = [
  { icon: 'receipt-outline' as const, label: 'Full-text search across all transactions' },
  { icon: 'wallet-outline' as const, label: 'Find accounts by name instantly' },
  { icon: 'pricetag-outline' as const, label: 'Locate categories across your history' },
];

function SearchGate() {
  const { colors } = useTheme();
  const router = useRouter();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
        <Ionicons name="arrow-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="search" size={32} color={colors.text} />
          <View style={styles.proBadge}>
            <Ionicons name="sparkles" size={10} color={colors.background} />
            <Text style={[styles.proBadgeText, { color: colors.background }]}>PRO</Text>
          </View>
        </View>

        <Text style={styles.title}>Global Search</Text>
        <Text style={styles.subtitle}>
          Find anything across your entire financial history in one place.
        </Text>

        <View style={styles.featureList}>
          {SEARCH_FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name={f.icon} size={15} color={colors.text} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.textMuted }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: colors.text }]}
          onPress={() => router.push('/premium')}
          activeOpacity={0.85}
        >
          <Ionicons name="sparkles" size={16} color={colors.background} />
          <Text style={[styles.ctaBtnText, { color: colors.background }]}>Upgrade to Pro</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6} style={styles.dismissBtn}>
          <Text style={[styles.dismissText, { color: colors.textMuted }]}>Not now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function SearchRoute() {
  const { isPremium } = usePremium();
  return isPremium ? <SearchScreen /> : <SearchGate />;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      margin: SPACING['4'],
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING['8'],
      paddingBottom: 80,
      gap: SPACING['4'],
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: RADIUS['2xl'],
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING['2'],
    },
    proBadge: {
      position: 'absolute',
      bottom: -6,
      right: -6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      height: 20,
      borderRadius: RADIUS.sm,
      backgroundColor: colors.text,
    },
    proBadgeText: {
      fontFamily: TYPOGRAPHY.fonts.bold,
      fontSize: 9,
      letterSpacing: 1,
    },
    title: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 32,
      color: colors.text,
      letterSpacing: -1,
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 260,
    },
    featureList: {
      width: '100%',
      gap: SPACING['2'],
      marginVertical: SPACING['2'],
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING['3'],
    },
    featureIcon: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureLabel: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 14,
      flex: 1,
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING['2'],
      width: '100%',
      height: 52,
      borderRadius: RADIUS.lg,
      marginTop: SPACING['2'],
    },
    ctaBtnText: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 15,
    },
    dismissBtn: {
      paddingVertical: SPACING['2'],
    },
    dismissText: {
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 13,
    },
  });
