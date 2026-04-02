import { Header } from '@/src/components/ui/Header';
import { FEATURES, MappedPlan, SKU_LIFETIME, SKU_MONTHLY, SKU_YEARLY } from '@/src/constants/iap';
import { PlanType, useSubscription } from '@/src/providers/SubscriptionProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ThemeColors } from '@/src/theme/colors';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// FEATURES is now imported from src/constants/iap

/**
 * PremiumScreen: The primary paywall and subscription management interface.
 * Implements an 'Editorial Brutalist' aesthetic with immersive background effects,
 * dynamic pricing tiers, and direct integration with the Luno Pro subscription system.
 */
export default function PremiumScreen() {
  const { colors, isDark } = useTheme();
  const { products, purchasePlan, restorePurchase, isPremium, subscription, manageSubscription, isLoading, error } = useSubscription();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('YEARLY');

  /**
   * MappedPlans: Reconciles raw store products with our logical plan definitions.
   * Includes data for badges, display naming, and a calculated 'original price' 
   * for the Lifetime tier to visualize the early-bird value.
   */
  const mappedPlans = useMemo((): MappedPlan[] => {
    const plans = [
      {
        id: 'MONTHLY' as PlanType,
        sku: SKU_MONTHLY,
        name: 'MONTHLY',
        period: '/ MO',
        badge: null
      },
      {
        id: 'YEARLY' as PlanType,
        sku: SKU_YEARLY,
        name: 'YEARLY',
        period: '/ YR',
        badge: 'SAVE 33%'
      },
      {
        id: 'LIFETIME' as PlanType,
        sku: SKU_LIFETIME,
        name: 'LIFETIME',
        period: 'ONCE',
        badge: 'EARLY BIRD'
      },
    ];

      return plans.map(plan => {
        const product = products.find(p => p.id === plan.sku);
        if (!product) return null;
  
        let originalPrice = null;
        if (plan.id === 'LIFETIME') {
          // Use the structured price from the new service
          const symbol = product.currencySymbol;
          const currentVal = product.priceAmount;
          if (currentVal > 0) {
            originalPrice = `${symbol}${Math.round(currentVal * 3.5)}`;
          }
        }
  
        return {
          ...plan,
          price: product.displayPrice,
          originalPrice,
        } as MappedPlan;
      }).filter((p): p is MappedPlan => !!p);
  }, [products]);

  const styles = useMemo(() => createStyles(colors, screenWidth), [colors, screenWidth]);

  // Sync selectedPlan with available plans
  useEffect(() => {
    if (mappedPlans.length > 0) {
      const isCurrentValid = mappedPlans.some(p => p.id === selectedPlan);
      if (!isCurrentValid) {
        // Default to Yearly if available, otherwise pick first in list
        const yearly = mappedPlans.find(p => p.id === 'YEARLY');
        setSelectedPlan(yearly ? 'YEARLY' : mappedPlans[0].id);
      }
    }
  }, [mappedPlans, selectedPlan]);

  const handlePurchase = useCallback(async () => {
    setIsProcessing(true);
    await purchasePlan(selectedPlan);
    setIsProcessing(false);
  }, [selectedPlan, purchasePlan]);

  const handleRestore = useCallback(async () => {
    setIsProcessing(true);
    await restorePurchase();
    setIsProcessing(false);
  }, [restorePurchase]);


  if (isPremium && !isProcessing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={[styles.bgCircle, { top: -60, left: -60, width: 340, height: 340, backgroundColor: colors.primary, opacity: 0.72 }]} />
          <View style={[styles.bgCircle, { bottom: -110, left: 40, width: 380, height: 380, backgroundColor: colors.primary, opacity: 0.6 }]} />
        </View>
        <BlurView blurAmount={Platform.OS === 'ios' ? 80 : 95} blurType={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <View style={styles.successContent}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={40} color={colors.background} />
          </View>
          <Text style={styles.successTitle}>Master of your capital.</Text>
          <Text style={styles.successSubtitle}>
            Your premium tools are active across all platforms. Enjoy absolute clarity over your wealth.
          </Text>
          
          <View style={{ width: '100%', gap: 12, marginTop: 40 }}>
            {subscription.planType !== 'LIFETIME' && (
              <TouchableOpacity
                style={[styles.successBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginTop: 0, shadowOpacity: 0 }]}
                onPress={manageSubscription}
              >
                <Text style={[styles.successBtnText, { color: colors.text }]}>MANAGE SUBSCRIPTION</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.successBtn, { marginTop: 0 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.successBtnText}>BACK TO DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        </View>
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
          <Text style={styles.heroKicker}>PRO SERVICE</Text>
          <Text style={styles.heroTitle}>Limitless control{"\n"}over your capital.</Text>
          <Text style={styles.heroSubtitle}>All plans include a 14-day free trial managed by your app store.</Text>
        </View>


        {/* ── Pricing Grid ── */}
        <View style={styles.pricingSection}>
          <Text style={styles.sectionLabel}>SELECT PLAN</Text>
          <View style={styles.planGrid}>
            {mappedPlans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && { borderColor: colors.primary, borderWidth: 2 }
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                  activeOpacity={0.9}
                >
                  {plan.badge && (
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
                  </View>
                  <View style={styles.priceRow}>
                    <View>
                      {plan.originalPrice && (
                        <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                      )}
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                        <Text style={styles.planPrice}>{plan.price}</Text>
                        <Text style={styles.planPeriod}>{plan.period}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={24} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => restorePurchase()}>
                  <Text style={styles.retryBtnText}>CHECK STORE AGAIN</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Skeleton Loading State */}
            {(isLoading && products.length === 0 && !error) && Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={[styles.planCard, { opacity: 0.5, borderStyle: 'dotted' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ))}

            {/* Empty State (Not loading, no error, but no products) */}
            {(!isLoading && products.length === 0 && !error) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>No plans found for your region.</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Features List ── */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionLabel}>PRO CAPABILITIES</Text>
            <View style={styles.featuresCard}>
              <View style={styles.featuresList}>
                {FEATURES.map((feature, index) => (
                  <View key={index} style={[styles.featureRow, index === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={styles.featureRowTitle}>{feature.title}</Text>
                  </View>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.learnMoreBtn} 
                onPress={() => router.push('/features')}
                activeOpacity={0.7}
              >
                <Text style={styles.learnMoreText}>LEARN MORE ABOUT PRO</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primary} />
              </TouchableOpacity>
            </View>
        </View>

        {/* ── Branding ── */}
        <View style={styles.brandingBox}>
          <Text style={styles.brandingText}>LUNO / CORE SERVICE</Text>
        </View>
      </ScrollView>

      {/* ── Action Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={handlePurchase}
          disabled={isProcessing || isPremium || products.length === 0}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buyBtnText}>
              {isPremium ? 'PRO MEMBER' : `UPGRADE TO ${selectedPlan}`}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.legalRows}>
          <TouchableOpacity onPress={handleRestore} disabled={isProcessing}>
            <Text style={styles.legalLink}>RESTORE</Text>
          </TouchableOpacity>
          <View style={styles.legalSeparator} />
          <TouchableOpacity onPress={() => Alert.alert("Terms", "Purchases are tied to your Apple/Google account.")}>
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

  heroSection: { marginTop: 24, marginBottom: 32 },
  heroKicker: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.primary, letterSpacing: 2, marginBottom: 8 },
  heroTitle: { fontFamily: TYPOGRAPHY.fonts.headingRegular, fontSize: 36, lineHeight: 42, color: colors.text, letterSpacing: -1.5 },
  heroSubtitle: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 12, lineHeight: 20 },

  trialCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trialContent: { flex: 1 },
  trialBadge: { backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
  trialBadgeText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 9, color: colors.background },
  trialTitle: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 18, color: colors.text },
  trialSubtitle: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  trialBtn: { backgroundColor: colors.text, paddingHorizontal: 16, height: 40, borderRadius: 12, justifyContent: 'center' },
  trialBtnText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 11, color: colors.background, letterSpacing: 1 },

  sectionLabel: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginBottom: 12 },

  pricingSection: { marginBottom: 32 },
  planGrid: { gap: 12 },
  planCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary + '15',
    minHeight: 90,
    justifyContent: 'center',
    position: 'relative',
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  planName: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 11, color: colors.textMuted, letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  planPrice: { fontFamily: TYPOGRAPHY.fonts.amountBold, fontSize: 26, color: colors.text, letterSpacing: -1 },
  originalPrice: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through', marginBottom: -2 },
  planPeriod: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 14, color: colors.textMuted },
  planBadge: { position: 'absolute', top: -10, right: 20, backgroundColor: colors.primary, paddingHorizontal: 10, height: 22, borderRadius: 11, justifyContent: 'center' },
  planBadgeText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 9, color: colors.background, letterSpacing: 0.5 },

  featuresSection: { marginBottom: 32 },
  featuresCard: { 
    backgroundColor: colors.surface, 
    borderRadius: 24, 
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.primary + '15',
  },
  featuresList: { padding: 8 },
  featureRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#00000008' // Subtle transparent grey
  },
  featureRowTitle: { 
    fontFamily: TYPOGRAPHY.fonts.semibold, 
    fontSize: 14, 
    color: colors.text, 
    letterSpacing: 0.2,
    flex: 1 
  },
  
  learnMoreBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 18, 
    backgroundColor: colors.primary + '08'
  },
  learnMoreText: { 
    fontFamily: TYPOGRAPHY.fonts.bold, 
    fontSize: 10, 
    color: colors.primary, 
    letterSpacing: 1.5 
  },

  brandingBox: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  brandingText: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.text + '20', letterSpacing: 3 },

  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 32, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.primary + '10' },
  buyBtn: { backgroundColor: colors.primary, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
  buyBtnText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 16, color: colors.background, letterSpacing: 1 },
  legalRows: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  legalLink: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  legalSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary + '20' },

  successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontFamily: TYPOGRAPHY.fonts.headingRegular, fontSize: 32, lineHeight: 38, color: colors.text, textAlign: 'center', letterSpacing: -1 },
  successSubtitle: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  successBtn: { backgroundColor: colors.text, width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  successBtnText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 14, color: colors.background, letterSpacing: 1 },

  errorBox: { 
    padding: 24, 
    borderRadius: 24, 
    backgroundColor: colors.danger + '10', 
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.danger + '20'
  },
  errorText: { 
    fontFamily: TYPOGRAPHY.fonts.regular, 
    fontSize: 14, 
    color: colors.danger, 
    textAlign: 'center',
    lineHeight: 20
  },
  retryBtn: { 
    backgroundColor: colors.danger, 
    paddingHorizontal: 20, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center' 
  },
  retryBtnText: { 
    fontFamily: TYPOGRAPHY.fonts.bold, 
    fontSize: 11, 
    color: colors.background, 
    letterSpacing: 1 
  },
});
