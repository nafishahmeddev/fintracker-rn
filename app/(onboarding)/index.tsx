import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { useCreateAccount } from '../../src/hooks/accounts';
import { useCreateCategory } from '../../src/hooks/categories';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { mutateAsync: createAccount, isPending: loadingAccount } = useCreateAccount();
  const { mutateAsync: createCategory, isPending: loadingCategory } = useCreateCategory();

  const [accountName, setAccountName] = useState('Cash Wallet');
  const [balance, setBalance] = useState('');

  const handleGetStarted = async () => {
    if (!accountName || !balance) {
      alert("Please enter your account name and starting balance to continue.");
      return;
    }

    try {
      // 1. Create the default user account
      await createAccount({
        name: accountName,
        holderName: 'Myself',
        accountNumber: 'N/A',
        icon: 58000,
        color: parseInt(colors.primary.replace('#', '0x')),
        isDefault: true,
        balance: parseFloat(balance),
        income: 0,
        expense: 0,
      });

      // 2. Seed default categories to make adding transactions easier later.
      const defaultCategories = [
        { name: 'Salary', icon: 58000, color: 0xFF10B981 }, // Green
        { name: 'Groceries', icon: 58000, color: 0xFFF59E0B }, // Amber
        { name: 'Transport', icon: 58000, color: 0xFF3B82F6 }, // Blue
        { name: 'Entertainment', icon: 58000, color: 0xFFEC4899 }, // Pink
      ];

      for (const cat of defaultCategories) {
        await createCategory(cat);
      }

      await completeOnboarding();
      router.replace('/(tabs)');
    } catch {
      alert("Failed to initialize account settings.");
    }
  };

  const isPending = loadingAccount || loadingCategory;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconPlaceholder}>
          <Text style={styles.emoji}>📈</Text>
        </View>
        <Text style={styles.title}>Track Your Finances, Seamlessly.</Text>
        <Text style={styles.subtitle}>
          Take control of your money with our premium dashboard and instant transaction syncing.
        </Text>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Set Up Your First Account</Text>
          <Input 
            label="Account Name" 
            value={accountName}
            onChangeText={setAccountName}
            placeholder="e.g. Checking Account"
          />
          <Input 
            label="Starting Balance" 
            value={balance}
            onChangeText={setBalance}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Setup Account & Get Started" 
          onPress={handleGetStarted} 
          size="lg" 
          isLoading={isPending}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 60,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: 16,
  },
  footer: {
    padding: 32,
    paddingBottom: 48,
  },
  button: {
    width: '100%',
  },
});
