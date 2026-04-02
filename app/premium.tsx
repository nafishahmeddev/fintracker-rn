import { Header } from '@/src/components/ui/Header';
import { FEATURES, SKU_LIFETIME } from '@/src/constants/iap';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * PremiumScreen: The primary paywall for Luno Pro Lifetime access.
 * Refined for high hierarchy and flat glassmorphic aesthetics.
 * The pricing is now the focal point, with a compact features list.
 */
export default function PremiumScreen() {
  const { colors, isDark } = useTheme();
  const { products, purchasePremium, restorePurchase, isPremium, isLoading, error } = usePremium();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [isProcessing, setIsProcessing] = useState(false);

  const lifetimeProduct = useMemo(() => {
    return products.find(p => p.id === SKU_LIFETIME);
  }, [products]);

  const styles = useMemo(() => createStyles(colors, screenWidth), [colors, screenWidth]);

  const handlePurchase = useCallback(async () => {
    setIsProcessing(true);
    await purchasePremium();
    setIsProcessing(false);
  }, [purchasePremium]);

  const handleRestore = useCallback(async () => {
    setIsProcessing(true);
    await restorePurchase();
    setIsProcessing(false);
  }, [restorePurchase]);

  if (isPremium && !isProcessing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.bgCircle, { top: -100, left: -100, width: 500, height: 500, backgroundColor: colors.primary, opacity: 0.15 }]} />
          <View style={[styles.bgCircle, { bottom: -150, right: -150, width: 600, height: 600, backgroundColor: colors.primary, opacity: 0.1 }]} />
        </View>
        <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 95} blurType={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />

        <SafeAreaView style={styles.successWrapper}>
          <View style={styles.proContent}>
             <View style={styles.proBadge}>
               <Ionicons name="sparkles" size={32} color={colors.primary} />
             </View>
             
             <View style={styles.proHero}>
               <Text style={styles.proKicker}>LIFETIME ACCESS</Text>
               <Text style={styles.proHeading}>Luno Pro{"\n"}Unlocked.</Text>
             </View>

             <View style={styles.proStatusRow}>
               <View style={styles.statusPill}>
                 <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                 <Text style={styles.statusText}>FOREVER MEMBER</Text>
               </View>
             </View>

             <Text style={styles.proDescription}>
               You have permanent, unrestricted access to the complete professional suite. All current and future features are yours.
             </Text>
          </View>

          <View style={styles.proActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>DASHBOARD</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.background} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Immersive Background ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.bgCircle, { top: -60, left: -60, width: 340, height: 340, backgroundColor: colors.primary, opacity: 0.72 }]} />
        <View style={[styles.bgCircle, { top: 180, right: -110, width: 440, height: 440, backgroundColor: colors.primaryDark, opacity: 0.52 }]} />
        <View style={[styles.bgCircle, { bottom: -110, left: 40, width: 380, height: 380, backgroundColor: colors.primary, opacity: 0.6 }]} />
      </View>
      <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 95} blurType={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      {Platform.OS === 'android' && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '60' }]} pointerEvents="none" />
      )}

      {/* ── Header ── */}
      <Header title="Luno Pro" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Editorial Hero ── */}
        <View style={styles.heroSection}>
          <Text style={styles.heroKicker}>ONE-TIME UPGRADE</Text>
          <Text style={styles.heroTitle}>Unlock peak financial clarity.</Text>
          <Text style={styles.heroSubtitle}>Unlock all professional tools with a single permanent license.</Text>
        </View>

        {/* ── Main Offer Card (PRIORITIZED HIERARCHY) ── */}
        <View style={styles.offerSection}>
          <View style={styles.lifetimeCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>LIFETIME ACCESS</Text>
                <Text style={styles.cardSubtitle}>Complete Pro Suite</Text>
              </View>
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>BEST VALUE</Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              {lifetimeProduct ? (
                <>
                  <Text style={styles.priceValue}>{lifetimeProduct.displayPrice}</Text>
                  <Text style={styles.priceSuffix}>ONE-TIME</Text>
                </>
              ) : isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.priceError}>Pricing unavailable</Text>
              )}
            </View>

            <View style={styles.cardDivider} />
            
            <View style={styles.trustInfo}>
                <View style={styles.trustRow}>
                  <Ionicons name="shield-checkmark" style={styles.trustIcon} size={14} color={colors.success} />
                  <Text style={styles.trustText}>Permanent Apple/Google Device License</Text>
                </View>
                <View style={styles.trustRow}>
                    <Ionicons name="cloud-done" style={styles.trustIcon} size={14} color={colors.success} />
                    <Text style={styles.trustText}>All future tool updates included</Text>
                </View>
            </View>
          </View>
        </View>

        {/* ── Compact Feature Section ── */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionLabel}>PRO CAPABILITIES</Text>
          
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={[styles.featureIconWrap, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name={feature.icon as any} size={16} color={colors.primary} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc} numberOfLines={2}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Error State ── */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={24} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.brandingBox}>
          <Text style={styles.brandingText}>LUNO / PRO SYSTEM</Text>
        </View>
      </ScrollView>

      {/* ── Action Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={handlePurchase}
          disabled={isProcessing || isPremium || !lifetimeProduct}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buyBtnText}>
              {isPremium ? 'PRO MEMBER' : `UPGRADE FOREVER`}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.legalRows}>
          <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
            <Text style={styles.legalLink}>RESTORE PURCHASE</Text>
          </TouchableOpacity>
          <View style={styles.legalSeparator} />
          <TouchableOpacity onPress={() => Alert.alert("Terms", "Luno Pro is a one-time purchase tied to your store account.")}>
            <Text style={styles.legalLink}>TERMS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors, screenWidth: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgCircle: { position: 'absolute', borderRadius: 999 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  heroSection: { marginTop: 20, marginBottom: 24 },
  heroKicker: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 10, color: colors.primary, letterSpacing: 2.5, marginBottom: 8 },
  heroTitle: { fontFamily: TYPOGRAPHY.fonts.headingRegular, fontSize: 40, lineHeight: 44, color: colors.text, letterSpacing: -2, marginBottom: 4 },
  heroSubtitle: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 22, maxWidth: '85%' },

  offerSection: { marginBottom: 28 },
  lifetimeCard: {
    backgroundColor: colors.surface + '80', // Glassmorphic transparency
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: colors.primary,
    position: 'relative',
    // No elevation or shadows for flat glass look
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 18, color: colors.text, letterSpacing: 0.5 },
  cardSubtitle: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  cardBadge: { backgroundColor: colors.primary, paddingHorizontal: 9, height: 20, borderRadius: 10, justifyContent: 'center' },
  cardBadgeText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 8, color: colors.background, letterSpacing: 1 },

  priceContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 18 },
  priceValue: { fontFamily: TYPOGRAPHY.fonts.amountBold, fontSize: 42, color: colors.text, letterSpacing: -1 },
  priceSuffix: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 14, color: colors.textMuted, letterSpacing: 0.5 },
  priceError: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 14, color: colors.danger },

  cardDivider: { height: 1, backgroundColor: colors.border, marginBottom: 14, opacity: 0.5 },
  trustInfo: { gap: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  trustIcon: { width: 14 },
  trustText: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 11, color: colors.success, letterSpacing: 0.1 },

  sectionLabel: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 16, opacity: 0.8 },
  
  featuresSection: { marginBottom: 32 },
  featuresGrid: { gap: 12 },
  featureRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface + '50',
      borderRadius: 20,
      padding: 14,
      gap: 14,
      borderWidth: 1,
      borderColor: colors.border,
  },
  featureIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
  },
  featureInfo: { flex: 1, justifyContent: 'center' },
  featureTitle: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 14, color: colors.text, marginBottom: 1 },
  featureDesc: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 12, color: colors.textMuted, lineHeight: 16 },

  brandingBox: { alignItems: 'center', marginTop: 10, marginBottom: 0 },
  brandingText: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.text + '20', letterSpacing: 3 },

  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 32, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.primary + '10' },
  buyBtn: { backgroundColor: colors.primary, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  buyBtnText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 16, color: colors.background, letterSpacing: 1.5 },
  legalRows: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  legalLink: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  legalSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary + '20' },

  successWrapper: { flex: 1, padding: 32, justifyContent: 'space-between' },
  proContent: { flex: 1, justifyContent: 'center' },
  proBadge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  proHero: { marginBottom: 24 },
  proKicker: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 11, color: colors.primary, letterSpacing: 3, marginBottom: 8 },
  proHeading: { fontFamily: TYPOGRAPHY.fonts.heading, fontSize: 56, lineHeight: 60, color: colors.text, letterSpacing: -3 },
  
  proStatusRow: { flexDirection: 'row', marginBottom: 32 },
  statusPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '30'
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 10, color: colors.text, letterSpacing: 1 },

  proDescription: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 16, color: colors.textMuted, lineHeight: 26, maxWidth: '90%' },
  proActions: { gap: 16, marginBottom: 12 },
  actionBtn: { height: 72, backgroundColor: colors.text, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  actionBtnText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 15, color: colors.background, letterSpacing: 2 },

  errorBox: { padding: 18, borderRadius: 18, backgroundColor: colors.danger + '10', alignItems: 'center', marginBottom: 20 },
  errorText: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 13, color: colors.danger, textAlign: 'center' },
});
