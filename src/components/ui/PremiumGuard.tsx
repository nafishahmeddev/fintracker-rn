import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../theme/typography';

interface PremiumGuardProps {
  children: React.ReactNode;
  label?: string;
  containerStyle?: any;
}

/**
 * A wrapper component that blurs its children if the user is not a premium subscriber.
 * Provides a call-to-action to upgrade.
 */
export function PremiumGuard({ children, label = 'PREMIUM FEATURE', containerStyle }: PremiumGuardProps) {
  const { isPremium } = usePremium();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Background content (rendered but slightly transparent) */}
      <View style={styles.blurredContent} pointerEvents="none">
        {children}
      </View>
      
      {/* Absolute overlay with Blur and CTA */}
      <View style={styles.overlayContainer}>
        <BlurView
          blurAmount={Platform.OS === 'ios' ? 10 : 15}
          blurType={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.ctaContent}>
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={12} color={colors.background} />
            <Text style={[styles.premiumBadgeText, { color: colors.background }]}>{label}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.upgradeButton, { backgroundColor: colors.text }]}
            onPress={() => router.push('/premium')}
            activeOpacity={0.85}
          >
            <Text style={[styles.upgradeButtonText, { color: colors.background }]}>Unlock with PRO</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  blurredContent: {
    opacity: 0.4,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaContent: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  premiumBadgeText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  upgradeButtonText: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontSize: 14,
  },
});
