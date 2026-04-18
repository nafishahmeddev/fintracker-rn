import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, COMPONENT_SIZES, ShadowToken, shadow } from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  shadow?: ShadowToken;
  icon?: keyof typeof Ionicons.glyphMap;
};

/**
 * Button - Editorial Brutalist Design
 * 
 * Size variants:
 * - sm: 36px height, 12px radius (md)
 * - md: 48px height, 16px radius (lg) - DEFAULT
 * - lg: 56px height, 20px radius (xl)
 * 
 * Variants:
 * - primary: Filled with primary color
 * - secondary: Outlined with border
 * - outline: Same as secondary (alias)
 * - danger: Filled with danger color
 * - success: Filled with success color
 * - ghost: Transparent with text only
 */
export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  shadow: shadowToken,
  icon,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const sizeConfig = COMPONENT_SIZES.button[size];

  const textColor = useMemo(() => {
    if (disabled) return colors.textMuted;
    if (variant === 'secondary' || variant === 'outline' || variant === 'ghost') return colors.text;
    return '#FFFFFF';
  }, [variant, disabled, colors.text, colors.textMuted]);

  const backgroundColor = useMemo(() => {
    if (disabled) return colors.surface;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'danger': return colors.danger;
      case 'success': return colors.success;
      case 'secondary':
      case 'outline':
      case 'ghost':
      default:
        return 'transparent';
    }
  }, [variant, disabled, colors.primary, colors.danger, colors.success, colors.surface]);

  const borderColor = useMemo(() => {
    if (disabled) return colors.border;
    if (variant === 'secondary' || variant === 'outline') return colors.border;
    return 'transparent';
  }, [variant, disabled, colors.border]);

  const shadowStyle = useMemo(() => {
    if (shadowToken) return shadow(shadowToken);
    if (variant === 'primary' && !disabled) return shadow('sm');
    return shadow('none');
  }, [shadowToken, variant, disabled]);

  const handlePress = useCallback(() => {
    if (!disabled && !isLoading) {
      onPress();
    }
  }, [disabled, isLoading, onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          backgroundColor,
          borderColor,
          borderWidth: variant === 'secondary' || variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        shadowStyle,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
    >
      {(variant === 'secondary' || variant === 'outline') && (
        <BlurView
          blurAmount={Platform.OS === 'ios' ? 20 : 0}
          blurType={isDark ? "dark" : "light"}
          style={[StyleSheet.absoluteFillObject, { 
            backgroundColor: Platform.OS === 'android' ? colors.surface : 'transparent',
            borderRadius: sizeConfig.borderRadius,
          }]}
        />
      )}
      
      {icon && !isLoading && (
        <Ionicons 
          name={icon} 
          size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
          color={textColor} 
          style={{ marginRight: spacing('2') }}
        />
      )}
      
      {isLoading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text 
          style={[
            styles.text, 
            { 
              color: textColor, 
              fontSize: sizeConfig.fontSize,
            }, 
            textStyle
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  text: {
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: -0.2,
  },
});
