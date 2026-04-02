import { Header } from '@/src/components/ui/Header';
import { useSubscription, PlanType } from '@/src/providers/SubscriptionProvider';
import { useTheme } from '@/src/providers/ThemeProvider';
import { TYPOGRAPHY } from '@/src/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SKU_LIFETIME, SKU_MONTHLY, SKU_YEARLY } from '@/src/constants/iap';

const FEATURES = [
  { icon: 'infinite', title: 'Financial Runway', description: 'Know exactly how many days your balance lasts.' },
  { icon: 'trending-up', title: 'Advanced Analytics', description: 'Get deep insights into your spending habits.' },
  { icon: 'calendar', title: 'Custom Time Ranges', description: 'Filter your data by any period (30D, 90D, All-time).' },
  { icon: 'pie-chart', title: 'Category Breakdown', description: 'Detailed visualization of where your money goes.' },
  { icon: 'git-compare', title: 'Period Comparison', description: 'Compare this month vs last month to track progress.' },
];

export default function PremiumScreen() {
  const { colors, isDark } = useTheme();
  const { subscription, products, purchasePlan, restorePurchase, startTrial, isPremium } = useSubscription();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('YEARLY');

  // Map store products to our logical plans, filtered by availability
  const mappedPlans = useMemo(() => {
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

    // Create the dynamic list based on store results
    return plans.map(plan => {
      const product = products.find(p => p.id === plan.sku);
      if (!product) return null;
      return {
        ...plan,
        price: product.displayPrice,
      };
    }).filter(p => !!p) as any[];
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

  const handleStartTrial = useCallback(async () => {
    setIsProcessing(true);
    await startTrial();
    setIsProcessing(false);
    router.back();
  }, [startTrial, router]);

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
          <TouchableOpacity 
            style={styles.successBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.successBtnText}>BACK TO DASHBOARD</Text>
          </TouchableOpacity>
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
          <Text style={styles.heroKicker}>UPGRADE SERVICE</Text>
          <Text style={styles.heroTitle}>Limitless control{"\n"}over your capital.</Text>
        </View>

        {/* ── Trial Card ── */}
        {!subscription.trialStartedAt && !isPremium && (
          <View style={styles.trialCard}>
            <View style={styles.trialContent}>
              <View style={styles.trialBadge}>
                <Text style={styles.trialBadgeText}>14D TRIAL</Text>
              </View>
              <Text style={styles.trialTitle}>Pure experience.</Text>
              <Text style={styles.trialSubtitle}>Experience Pro free for 14 days. No string attached.</Text>
            </View>
            <TouchableOpacity 
              style={styles.trialBtn}
              onPress={handleStartTrial}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.trialBtnText}>ACTIVATE</Text>
            </TouchableOpacity>
          </View>
        )}
        
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
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Skeleton Loading State */}
            {mappedPlans.length === 0 && Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={[styles.planCard, { opacity: 0.5, borderStyle: 'dotted' }]}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ))}
          </View>
        </View>

        {/* ── Features List ── */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionLabel}>PRO CAPABILITIES</Text>
          <View style={styles.featuresCard}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={[styles.featureRow, index === FEATURES.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.featureIconBox, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name={feature.icon as any} size={18} color={colors.primary} />
                </View>
                <View style={styles.featureMeta}>
                  <Text style={featureTitleStyle(colors)}>{feature.title}</Text>
                  <Text style={featureDescStyle(colors)}>{feature.description}</Text>
                </View>
              </View>
            ))}
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

// Helper style functions to avoid complex nesting in JSX
const featureTitleStyle = (colors: any) => ({ fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 15, color: colors.text });
const featureDescStyle = (colors: any) => ({ fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 });

const createStyles = (colors: any, screenWidth: number) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bgCircle: { position: 'absolute', borderRadius: 999 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  
  heroSection: { marginTop: 24, marginBottom: 32 },
  heroKicker: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.primary, letterSpacing: 2, marginBottom: 8 },
  heroTitle: { fontFamily: TYPOGRAPHY.fonts.headingRegular, fontSize: 36, lineHeight: 42, color: colors.text, letterSpacing: -1.5 },
  
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
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 90,
    justifyContent: 'center',
    position: 'relative',
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  planName: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 11, color: colors.textMuted, letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  planPrice: { fontFamily: TYPOGRAPHY.fonts.amountBold, fontSize: 26, color: colors.text, letterSpacing: -1 },
  planPeriod: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 14, color: colors.textMuted },
  planBadge: { position: 'absolute', top: -10, right: 20, backgroundColor: colors.primary, paddingHorizontal: 10, height: 22, borderRadius: 11, justifyContent: 'center' },
  planBadgeText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 9, color: colors.background, letterSpacing: 0.5 },

  featuresSection: { marginBottom: 32 },
  featuresCard: { backgroundColor: colors.surface, borderRadius: 24, overflow: 'hidden', padding: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border + '60' },
  featureIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureMeta: { flex: 1 },

  brandingBox: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  brandingText: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.text + '20', letterSpacing: 3 },

  footer: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 32, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  buyBtn: { backgroundColor: colors.primary, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
  buyBtnText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 16, color: colors.background, letterSpacing: 1 },
  legalRows: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16 },
  legalLink: { fontFamily: TYPOGRAPHY.fonts.semibold, fontSize: 10, color: colors.textMuted, letterSpacing: 1.5 },
  legalSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.border },

  successContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontFamily: TYPOGRAPHY.fonts.headingRegular, fontSize: 32, lineHeight: 38, color: colors.text, textAlign: 'center', letterSpacing: -1 },
  successSubtitle: { fontFamily: TYPOGRAPHY.fonts.regular, fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  successBtn: { backgroundColor: colors.text, width: '100%', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  successBtnText: { fontFamily: TYPOGRAPHY.fonts.bold, fontSize: 14, color: colors.background, letterSpacing: 1 },
});
