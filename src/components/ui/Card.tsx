import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { COMPONENT_SIZES, shadow, ShadowToken } from '../../theme/tokens';

type CardSize = 'sm' | 'md' | 'lg';
type CardVariant = 'default' | 'filled' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  size?: CardSize;
  variant?: CardVariant;
  shadow?: ShadowToken;
};

/**
 * Card - Editorial Brutalist Design
 * 
 * Size variants (padding + radius):
 * - sm: 12px padding, 16px radius (lg)
 * - md: 16px padding, 20px radius (xl) - DEFAULT
 * - lg: 20px padding, 24px radius (2xl)
 * 
 * Variants:
 * - default: Subtle surface background with blur
 * - filled: Solid surface background
 * - outlined: Border only, transparent background
 */
export const Card = React.memo(function Card({ 
  children, 
  style,
  size = 'md',
  variant = 'default',
  shadow: shadowToken,
}: CardProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const sizeConfig = COMPONENT_SIZES.card[size];

  const backgroundStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { backgroundColor: colors.surface };
      case 'outlined':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'default':
      default:
        return { backgroundColor: Platform.OS === 'android' ? colors.card : 'transparent' };
    }
  }, [variant, colors.surface, colors.card, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return shadow(shadowToken);
    if (variant === 'default') return shadow('sm');
    return shadow('none');
  }, [shadowToken, variant]);

  const blurStyle = useMemo(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? colors.card : 'transparent',
    borderRadius: sizeConfig.borderRadius,
  }), [colors.card, sizeConfig.borderRadius]);

  return (
    <View
      style={[
        styles.card,
        {
          padding: sizeConfig.padding,
          borderRadius: sizeConfig.borderRadius,
        },
        backgroundStyle,
        shadowStyle,
        style,
      ]}
    >
      {variant === 'default' && (
        <BlurView
          blurAmount={Platform.OS === 'ios' ? 25 : 0}
          blurType={isDark ? "dark" : "light"}
          style={blurStyle}
        />
      )}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
