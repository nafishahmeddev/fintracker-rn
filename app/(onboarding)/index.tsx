import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurBackground } from '../../src/components/ui/BlurBackground';
import { Button } from '../../src/components/ui/Button';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '../../src/constants/picker';
import { useCreateAccount } from '../../src/features/accounts/hooks/accounts';
import { useCreateCategory } from '../../src/features/categories/hooks/categories';
import { AccountStep } from '../../src/features/onboarding/components/AccountStep';
import { ProfileStep } from '../../src/features/onboarding/components/ProfileStep';
import { WelcomeStep } from '../../src/features/onboarding/components/WelcomeStep';
import { getDeviceCurrencyCode } from '../../src/constants/currency';
import {
  ONBOARDING_STEPS,
} from '../../src/features/onboarding/constants';
import { createOnboardingStyles } from '../../src/features/onboarding/styles';
import { OnboardingFormValues } from '../../src/features/onboarding/types';
import { parseAmount, toDbColor } from '../../src/utils/format';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useTheme } from '../../src/providers/ThemeProvider';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createOnboardingStyles(colors), [colors]);
  const { completeOnboarding } = useOnboarding();
  const { updateProfile } = useSettings();
  const { mutateAsync: createAccount, isPending: accountPending } = useCreateAccount();
  const { mutateAsync: createCategory, isPending: categoryPending } = useCreateCategory();

  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = ONBOARDING_STEPS[stepIndex];

  const [accountCurrency, setAccountCurrency] = React.useState<string>(() => getDeviceCurrencyCode());
  const [accountIcon, setAccountIcon] = React.useState<string>(ACCOUNT_ICONS[0]);
  const [accountColor, setAccountColor] = React.useState<string>(ACCOUNT_COLORS[0]);

  const methods = useForm<OnboardingFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      accountName: '',
      accountHolder: '',
      accountNumber: '',
      openingBalance: '0',
    },
  });

  const { trigger, getValues } = methods;

  const isPending = accountPending || categoryPending;

  const validateStep = async () => {
    if (currentStep.id === 'profile') {
      return trigger('name');
    }
    if (currentStep.id === 'account') {
      return trigger(['accountName', 'accountHolder', 'accountNumber', 'openingBalance']);
    }
    return true;
  };

  const seedCategories = async () => {
    const defaults: { name: string; icon: string; color: number; type: 'CR' | 'DR' }[] = [
      // ── Income ──────────────────────────────────────────────────────
      { name: 'Salary',        icon: 'cash-outline',          color: toDbColor('#6BD498'), type: 'CR' },
      { name: 'Freelance',     icon: 'sparkles-outline',      color: toDbColor('#B8D641'), type: 'CR' },
      { name: 'Business',      icon: 'briefcase-outline',     color: toDbColor('#63A4FF'), type: 'CR' },
      { name: 'Investment',    icon: 'trending-up-outline',   color: toDbColor('#A78BFA'), type: 'CR' },
      { name: 'Rental',        icon: 'home-outline',          color: toDbColor('#34D399'), type: 'CR' },
      { name: 'Bonus',         icon: 'gift-outline',          color: toDbColor('#F9A8D4'), type: 'CR' },
      { name: 'Refund',        icon: 'refresh-outline',       color: toDbColor('#6EE7B7'), type: 'CR' },
      { name: 'Side Income',   icon: 'wallet-outline',        color: toDbColor('#FCD34D'), type: 'CR' },

      // ── Essentials ──────────────────────────────────────────────────
      { name: 'Groceries',     icon: 'basket-outline',        color: toDbColor('#F5C451'), type: 'DR' },
      { name: 'Rent',          icon: 'business-outline',      color: toDbColor('#FF8A65'), type: 'DR' },
      { name: 'Utilities',     icon: 'flash-outline',         color: toDbColor('#FBBF24'), type: 'DR' },
      { name: 'Internet',      icon: 'wifi-outline',          color: toDbColor('#60A5FA'), type: 'DR' },
      { name: 'Phone',         icon: 'phone-portrait-outline',color: toDbColor('#818CF8'), type: 'DR' },
      { name: 'Insurance',     icon: 'shield-checkmark-outline', color: toDbColor('#6B7280'), type: 'DR' },
      { name: 'Loan / EMI',    icon: 'card-outline',          color: toDbColor('#EF4444'), type: 'DR' },

      // ── Transport ───────────────────────────────────────────────────
      { name: 'Transport',     icon: 'car-outline',           color: toDbColor('#63A4FF'), type: 'DR' },
      { name: 'Fuel',          icon: 'speedometer-outline',   color: toDbColor('#FB923C'), type: 'DR' },
      { name: 'Parking',       icon: 'locate-outline',        color: toDbColor('#94A3B8'), type: 'DR' },
      { name: 'Travel',        icon: 'airplane-outline',      color: toDbColor('#38BDF8'), type: 'DR' },

      // ── Food & Social ────────────────────────────────────────────────
      { name: 'Dining Out',    icon: 'restaurant-outline',    color: toDbColor('#F87171'), type: 'DR' },
      { name: 'Coffee',        icon: 'cafe-outline',          color: toDbColor('#C4A35A'), type: 'DR' },
      { name: 'Alcohol',       icon: 'wine-outline',          color: toDbColor('#C084FC'), type: 'DR' },

      // ── Health & Fitness ─────────────────────────────────────────────
      { name: 'Healthcare',    icon: 'medkit-outline',        color: toDbColor('#34D399'), type: 'DR' },
      { name: 'Pharmacy',      icon: 'bandage-outline',       color: toDbColor('#6EE7B7'), type: 'DR' },
      { name: 'Gym',           icon: 'barbell-outline',       color: toDbColor('#4ADE80'), type: 'DR' },

      // ── Lifestyle ────────────────────────────────────────────────────
      { name: 'Shopping',      icon: 'bag-outline',           color: toDbColor('#F472B6'), type: 'DR' },
      { name: 'Electronics',   icon: 'hardware-chip-outline', color: toDbColor('#A5B4FC'), type: 'DR' },
      { name: 'Subscriptions', icon: 'repeat-outline',        color: toDbColor('#C084FC'), type: 'DR' },
      { name: 'Entertainment', icon: 'film-outline',          color: toDbColor('#FCA5A5'), type: 'DR' },
      { name: 'Games',         icon: 'game-controller-outline', color: toDbColor('#7C3AED'), type: 'DR' },
      { name: 'Books',         icon: 'book-outline',          color: toDbColor('#D97706'), type: 'DR' },
      { name: 'Education',     icon: 'school-outline',        color: toDbColor('#0EA5E9'), type: 'DR' },

      // ── Home ─────────────────────────────────────────────────────────
      { name: 'Home & Garden', icon: 'leaf-outline',          color: toDbColor('#86EFAC'), type: 'DR' },
      { name: 'Maintenance',   icon: 'build-outline',         color: toDbColor('#9CA3AF'), type: 'DR' },
      { name: 'Furniture',     icon: 'bed-outline',           color: toDbColor('#C4B5FD'), type: 'DR' },

      // ── Personal & Other ─────────────────────────────────────────────
      { name: 'Personal Care', icon: 'cut-outline',           color: toDbColor('#F9A8D4'), type: 'DR' },
      { name: 'Kids',          icon: 'happy-outline',         color: toDbColor('#FCD34D'), type: 'DR' },
      { name: 'Pets',          icon: 'paw-outline',           color: toDbColor('#A3E635'), type: 'DR' },
      { name: 'Charity',       icon: 'heart-outline',         color: toDbColor('#FB7185'), type: 'DR' },
      { name: 'Taxes',         icon: 'document-text-outline', color: toDbColor('#6B7280'), type: 'DR' },
      { name: 'Other',         icon: 'ellipsis-horizontal-outline', color: toDbColor('#94A3B8'), type: 'DR' },
    ];

    for (const category of defaults) {
      await createCategory(category);
    }
  };

  const finalizeSetup = async () => {
    const values = getValues();
    try {
      await updateProfile({
        name: values.name.trim(),
        email: '',
        phone: '',
        defaultCurrency: accountCurrency,
      });

      await createAccount({
        name: values.accountName.trim(),
        holderName: values.accountHolder.trim(),
        accountNumber: values.accountNumber.trim(),
        icon: accountIcon.replace('-outline', ''),
        color: toDbColor(accountColor),
        isDefault: true,
        currency: accountCurrency,
        balance: parseAmount(values.openingBalance),
        income: 0,
        expense: 0,
      });

      await seedCategories();
      await completeOnboarding();
      router.replace('/(main)');
    } catch {
      Alert.alert('Setup failed', 'Could not initialize your workspace. Please try again.');
    }
  };

  const handleContinue = async () => {
    const valid = await validateStep();
    if (!valid) return;

    if (stepIndex === ONBOARDING_STEPS.length - 1) {
      await finalizeSetup();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return <WelcomeStep />;
      case 'profile':
        return <ProfileStep />;
      case 'account':
        return (
          <AccountStep
            accountCurrency={accountCurrency}
            accountIcon={accountIcon}
            accountColor={accountColor}
            onCurrencyChange={setAccountCurrency}
            onIconChange={setAccountIcon}
            onColorChange={setAccountColor}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <BlurBackground androidOverlayOpacity="76" />

      <FormProvider {...methods}>
        <KeyboardAvoidingView style={styles.keyboardWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            {stepIndex > 0 ? (
              <TouchableOpacity style={styles.headerBackButton} onPress={() => setStepIndex((current) => current - 1)} activeOpacity={0.9}>
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerBackPlaceholder} />
            )}

            <Text style={styles.brand}>FINTRACKER.</Text>

            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>{stepIndex + 1}/{ONBOARDING_STEPS.length}</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            {ONBOARDING_STEPS.map((step, index) => (
              <View key={step.id} style={[styles.progressDot, index <= stepIndex && styles.progressDotActive]} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.stepMeta}>
            <Text style={styles.eyebrow}>{currentStep.eyebrow}</Text>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepSubtitle}>{currentStep.subtitle}</Text>
          </View>

          <View style={styles.contentCard}>{renderStepContent()}</View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={stepIndex === ONBOARDING_STEPS.length - 1 ? 'Launch Fintracker' : 'Continue'}
            onPress={handleContinue}
            size="lg"
            isLoading={isPending}
            style={styles.primaryAction}
          />
        </View>
        </KeyboardAvoidingView>
      </FormProvider>
    </SafeAreaView>
  );
}
