import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { ThemeColors } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  variant?: 'default' | 'minimal';
}

export function Input({ label, error, style, variant = 'default', ...props }: InputProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        variant === 'default' ? styles.inputContainer : styles.minimalContainer, 
        error ? styles.inputError : null
      ]}>
        <TextInput
          style={[
            variant === 'default' ? styles.input : styles.minimalInput,
            style
          ]}
          placeholderTextColor={colors.textMuted + '80'}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: 0, // Let parent handle spacing in high-density
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  minimalContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '50',
    overflow: 'hidden',
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    color: colors.text,
    fontSize: TYPOGRAPHY.sizes.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 56,
    fontFamily: TYPOGRAPHY.fonts.regular,
  },
  minimalInput: {
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 0,
    height: 48,
    fontFamily: TYPOGRAPHY.fonts.regular,
  },
  errorText: {
    color: colors.danger,
    fontSize: TYPOGRAPHY.sizes.sm,
    marginTop: 4,
  },
});
