import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePremium } from '@/src/providers/PremiumProvider';
import { useTheme } from '../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../theme/typography';

interface PremiumGuardProps {
  children: React.ReactNode;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  containerStyle?: any;
}

/**
 * A wrapper component that blurs its children if the user is not a premium subscriber.
 * Provides a call-to-action to upgrade.
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

  const { isSmall, isMedium, containerStyles, iconBoxStyles, iconSize, actionBadgeStyles, actionText } = useMemo(() => {
    const small = size === 'small';
    const medium = size === 'medium';
    return {
      isSmall: small,
      isMedium: medium,
      containerStyles: [
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        small && styles.containerSmall,
        medium && styles.containerMedium,
        containerStyle
      ],
      iconBoxStyles: [
        styles.iconBox,
        { backgroundColor: colors.background, borderColor: colors.border },
        small && styles.iconBoxSmall
      ],
      iconSize: small ? 14 : 18,
      actionBadgeStyles: [
        styles.actionBadge,
        { backgroundColor: colors.text },
        small && styles.actionBadgeSmall
      ],
      actionText: small ? 'Pro' : 'Unlock'
    };
  }, [size, colors.surface, colors.border, colors.background, colors.text, containerStyle]);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
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
               {actionText}
             </Text>
          </View>

        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    minHeight: 90,
    justifyContent: 'center',
    padding: 20,
  },
  containerMedium: {
    minHeight: 76,
    padding: 16,
    borderRadius: 18,
  },
  containerSmall: {
    minHeight: 56,
    padding: 12,
    borderRadius: 14,
  },
  watermark: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    transform: [{ rotate: '-15deg' }],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  iconBoxSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  textDetails: {
    flex: 1,
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 14,
    marginBottom: 4,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: {
    fontFamily: TYPOGRAPHY.fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
});
