import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        <BlurView intensity={15} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFillObject} />
        <TextInput
          style={[
            styles.input, 
            (props.keyboardType === 'decimal-pad' || props.keyboardType === 'numeric') ? { fontFamily: typography.fonts.monoBold } : {},
            style
          ]}
          placeholderTextColor={colors.textMuted}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: typography.weights.medium,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    paddingHorizontal: 16,
    height: 64,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
});
