import { BlurView } from '@sbaiahmed1/react-native-blur';
import React, { useMemo, useCallback } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const Button = React.memo(function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const textColor = useMemo(() => {
    if (variant === 'outline' || variant === 'secondary') return colors.text;
    return '#FFFFFF';
  }, [variant, colors.text]);

  const height = useMemo(() => {
    switch (size) {
      case 'sm': return 36;
      case 'lg': return 56;
      case 'md':
      default: return 48;
    }
  }, [size]);

  const backgroundColor = useMemo(() => {
    if (variant === 'primary') return colors.primary;
    if (variant === 'success') return colors.success;
    if (variant === 'danger') return colors.danger;
    return 'transparent';
  }, [variant, colors.primary, colors.success, colors.danger]);

  const borderColor = useMemo(() => {
    return variant === 'outline' || variant === 'secondary' ? colors.primary + '22' : 'transparent';
  }, [variant, colors.primary]);

  const borderWidth = useMemo(() => {
    return variant === 'outline' || variant === 'secondary' ? 1 : 0;
  }, [variant]);

  const blurStyle = useMemo(() => ({
    backgroundColor: Platform.OS === 'android' ? colors.surface : 'transparent'
  }), [colors.surface]);

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
          backgroundColor,
          height,
          borderColor,
          borderWidth,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {(variant === 'outline' || variant === 'secondary') && (
        <BlurView
          blurAmount={Platform.OS === 'ios' ? 20 : 0}
          blurType={isDark ? "dark" : "light"}
          style={[StyleSheet.absoluteFillObject, blurStyle]}
        />
      )}
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
});

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    borderRadius: 100, // Seamless round layout
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  text: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fonts.semibold,
    fontWeight: TYPOGRAPHY.weights.semibold,
    letterSpacing: -0.2,
  },
});
