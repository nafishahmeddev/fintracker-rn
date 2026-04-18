import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius } from '../../theme/tokens';

interface PremiumGuardProps {
  children: React.ReactNode;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: any;
}

/**
 * PremiumGuard - Editorial Brutalist Design
 * 
 * Sizes:
 * - small: 56px min height, 12px padding, 12px radius (md)
 * - medium: 76px min height, 16px padding, 16px radius (lg)
 * - large: 90px min height, 20px padding, 20px radius (xl)
 * 
 * Icon box: 44px (md), 32px (sm)
 * Action badge: 12px radius (md), 8px (sm)
 */
export const PremiumGuard = React.memo(function PremiumGuard({
  children,
  label = 'Pro only',
  size = 'large',
  containerStyle
}: PremiumGuardProps) {
  const { isPremium } = usePremium();
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = useCallback(() => {
    router.push('/premium');
  }, [router]);

  const { isSmall, containerStyles, iconBoxStyles, iconSize, actionBadgeStyles, actionTextLabel } = useMemo(() => {
    const small = size === 'small';
    const medium = size === 'medium';
    
    // Size-specific values
    const padding = small ? spacing('3') : medium ? spacing('4') : spacing('5');
    const borderRadius = small ? radius('md') : medium ? radius('lg') : radius('xl');
    const minHeight = small ? 56 : medium ? 76 : 90;
    
    return {
      isSmall: small,
      containerStyles: [
        styles.container,
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
          padding,
          borderRadius,
          minHeight,
        },
        containerStyle
      ],
      iconBoxStyles: [
        styles.iconBox,
        { 
          backgroundColor: colors.background, 
          borderColor: colors.border,
          width: small ? 32 : 44,
          height: small ? 32 : 44,
          borderRadius: small ? radius('sm') : radius('md'),
        },
      ],
      iconSize: small ? 14 : 18,
      actionBadgeStyles: [
        styles.actionBadge,
        { 
          backgroundColor: colors.text,
          paddingHorizontal: small ? spacing('2.5') : spacing('3.5'),
          paddingVertical: small ? spacing('1.5') : spacing('2.5'),
          borderRadius: small ? radius('sm') : radius('md'),
        },
      ],
      actionTextLabel: small ? 'Pro' : 'Unlock'
    };
  }, [size, colors.surface, colors.border, colors.background, colors.text, containerStyle]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={containerStyles}
    >
      {/* Background Accent & Watermark */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.primary, opacity: 0.02 }]} />
      <Ionicons
        name="sparkles"
        size={isSmall ? 60 : 120}
        color={colors.primary}
        style={[styles.watermark, { opacity: 0.05 }]}
        pointerEvents="none"
      />

      <View style={styles.content}>
        <View style={styles.headerRow}>

          <View style={iconBoxStyles}>
             <Ionicons name="lock-closed" size={iconSize} color={colors.text} />
          </View>

          <View style={styles.textDetails}>
             <Text style={[styles.title, { color: colors.text }, isSmall && styles.titleSmall]}>
               {label}
             </Text>
             {!isSmall && (
               <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                 Premium member exclusive
               </Text>
             )}
          </View>

          <View style={actionBadgeStyles}>
             <Text style={[styles.actionText, { color: colors.background }]}>
               {actionTextLabel}
             </Text>
          </View>

        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  watermark: {
    position: 'absolute',
    right: -spacing('5'),
    bottom: -spacing('8'),
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('3.5'),
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  textDetails: {
    flex: 1,
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 14,
    marginBottom: spacing('1'),
  },
  titleSmall: {
    fontSize: 11,
    marginBottom: 0,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    fontSize: 12,
  },
  actionBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
});
