import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { spacing, COMPONENT_SIZES } from '../../theme/tokens';

type InputSize = 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'minimal' | 'filled';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
}

/**
 * Input - Editorial Brutalist Design
 * 
 * Size variants (height + padding + radius):
 * - sm: 40px height, 12px padding, 12px radius (md)
 * - md: 56px height, 16px padding, 16px radius (lg) - DEFAULT
 * - lg: 64px height, 16px padding, 20px radius (xl)
 * 
 * Variants:
 * - default: Outlined with border
 * - minimal: Bottom border only
 * - filled: Solid background, no border
 */
export const Input = React.memo(function Input({ 
  label, 
  error, 
  size = 'md',
  variant = 'default',
  style,
  placeholderTextColor,
  ...props 
}: InputProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);

  const sizeConfig = COMPONENT_SIZES.input[size];

  const containerStyle = useMemo(() => {
    switch (variant) {
      case 'filled':
        return { 
          backgroundColor: colors.surface,
          borderWidth: 0,
        };
      case 'minimal':
        return { 
          backgroundColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: error ? colors.danger : colors.border,
        };
      case 'default':
      default:
        return { 
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
        };
    }
  }, [variant, error, colors.surface, colors.border, colors.danger]);

  const placeholderColor = placeholderTextColor || colors.textMuted + '80';

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[
        styles.inputContainer,
        {
          height: sizeConfig.height,
          paddingHorizontal: variant === 'minimal' ? 0 : sizeConfig.paddingHorizontal,
          borderRadius: variant === 'minimal' ? 0 : sizeConfig.borderRadius,
        },
        containerStyle,
      ]}>
        <TextInput
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
              paddingVertical: 0,
            },
            variant === 'minimal' && { paddingHorizontal: 0 },
            style,
          ]}
          placeholderTextColor={placeholderColor}
          {...props}
        />
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
});

const createStyles = (colors: ThemeColors, size: InputSize) => StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing('2'),
    fontFamily: TYPOGRAPHY.fonts.medium,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  inputContainer: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  input: {
    fontFamily: TYPOGRAPHY.fonts.regular,
    textAlignVertical: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: spacing('1'),
    fontFamily: TYPOGRAPHY.fonts.medium,
  },
});
