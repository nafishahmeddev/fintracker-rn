import { BlurView } from 'expo-blur';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

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

export function Button({
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
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const getTextColor = () => {
    if (variant === 'outline') return colors.text;
    return '#FFFFFF';
  };

  const getHeight = () => {
    switch (size) {
      case 'sm': return 36;
      case 'lg': return 56;
      case 'md':
      default: return 48;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        {
          backgroundColor: variant === 'primary' ? colors.primary : variant === 'success' ? colors.success : variant === 'danger' ? colors.danger : 'transparent',
          height: getHeight(),
          borderColor: variant === 'outline' || variant === 'secondary' ? colors.border : 'transparent',
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {(variant === 'outline' || variant === 'secondary') && (
        <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
      )}
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

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
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
