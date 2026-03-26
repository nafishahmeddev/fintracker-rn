import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../../theme/typography';
import { OnboardingFormValues } from '../types';

export function ProfileStep() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { control, formState: { errors } } = useFormContext<OnboardingFormValues>();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.prompt}>Tell us your name</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field }) => (
          <TextInput
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            placeholder="John"
            placeholderTextColor={colors.textMuted + '80'}
            style={styles.nameInput}
            autoCapitalize="words"
            autoCorrect={false}
          />
        )}
      />
      <View style={[styles.nameUnderline, errors.name && styles.nameUnderlineError]} />

      <View style={styles.noteRow}>
        <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.noteText}>This name is used for your account holder and profile identity.</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    wrapper: {
      gap: 12,
    },
    prompt: {
      fontFamily: TYPOGRAPHY.fonts.semibold,
      fontSize: 14,
      color: colors.textMuted,
      letterSpacing: 0.2,
    },
    nameInput: {
      fontFamily: TYPOGRAPHY.fonts.heading,
      fontSize: 44,
      lineHeight: 48,
      color: colors.text,
      letterSpacing: -1.2,
      paddingHorizontal: 0,
      paddingVertical: 2,
      minHeight: 58,
    },
    nameUnderline: {
      height: 2,
      borderRadius: 999,
      backgroundColor: colors.primary + '66',
      marginTop: -2,
      marginBottom: 8,
    },
    nameUnderlineError: {
      backgroundColor: colors.danger + '99',
    },
    noteRow: {
      marginTop: 4,
      minHeight: 46,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.primary + '12',
      borderWidth: 1,
      borderColor: colors.primary + '26',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    noteText: {
      flex: 1,
      fontFamily: TYPOGRAPHY.fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.text,
    },
  });
