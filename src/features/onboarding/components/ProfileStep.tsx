import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Input } from '../../../components/ui/Input';
import { useTheme } from '../../../providers/ThemeProvider';
import { typography } from '../../../theme/typography';

type ProfileStepProps = {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
};

export function ProfileStep({ name, email, phone, onNameChange, onEmailChange, onPhoneChange }: ProfileStepProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <Input label="Full Name" placeholder="Ahmed Khan" value={name} onChangeText={onNameChange} />
      <Input label="Email" placeholder="Optional" value={email} onChangeText={onEmailChange} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Phone" placeholder="Optional" value={phone} onChangeText={onPhoneChange} keyboardType="phone-pad" />

      <View style={styles.noteRow}>
        <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
        <Text style={styles.noteText}>Your name prefills the first account holder value.</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: { [key: string]: string }) =>
  StyleSheet.create({
    wrapper: {
      gap: 12,
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
      fontFamily: typography.fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: colors.text,
    },
  });
