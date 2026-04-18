import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, radius, LAYOUT } from '../../theme/tokens';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
};

/**
 * Header - Editorial Brutalist Design
 * 
 * Layout:
 * - Screen padding: 24px
 * - Top padding: 12px
 * - Bottom padding: 16px
 * - Gap between elements: 16px
 * 
 * Back button:
 * - Size: 44px (touch target)
 * - Radius: 12px (md)
 */
export const Header = React.memo(function Header({ 
  title, 
  subtitle, 
  showBack, 
  rightAction 
}: HeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backBtn} 
            activeOpacity={0.75}
          >
            <Ionicons 
              name="arrow-back" 
              size={20} 
              color={colors.text} 
            />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightAction && (
        <View style={styles.rightActionWrap}>
          {rightAction}
        </View>
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LAYOUT.screenPadding,
    paddingTop: spacing('3'),
    paddingBottom: spacing('4'),
    backgroundColor: 'transparent',
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing('4'),
  },
  backBtn: {
    width: LAYOUT.minTouchTarget,
    height: LAYOUT.minTouchTarget,
    borderRadius: radius('md'),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.fonts.heading,
    color: colors.text,
    fontSize: 28,
    letterSpacing: -1,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 0.1,
    marginTop: spacing('0.5'),
  },
  rightActionWrap: {
    justifyContent: 'center',
  },
});
