import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
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
import { useCreateAccount } from '../../src/features/accounts/hooks/accounts';
import { useCreateCategory } from '../../src/features/categories/hooks/categories';
import { AccountStep } from '../../src/features/onboarding/components/AccountStep';
import { CurrencyStep } from '../../src/features/onboarding/components/CurrencyStep';
import { ProfileStep } from '../../src/features/onboarding/components/ProfileStep';
import { WelcomeStep } from '../../src/features/onboarding/components/WelcomeStep';
import {
  getDeviceCurrencyCode,
  ONBOARDING_ACCOUNT_COLORS,
  ONBOARDING_ACCOUNT_ICONS,
  ONBOARDING_STEPS,
} from '../../src/features/onboarding/constants';
import { createOnboardingStyles } from '../../src/features/onboarding/styles';
import { parseAmount, toDbColor } from '../../src/features/onboarding/utils';
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

  const [name, setName] = React.useState('');
  const [defaultCurrency, setDefaultCurrency] = React.useState<string>(() => getDeviceCurrencyCode());
  const [accountName, setAccountName] = React.useState('Main Wallet');
  const [accountHolder, setAccountHolder] = React.useState('');
  const [accountNumber, setAccountNumber] = React.useState('');
  const [openingBalance, setOpeningBalance] = React.useState('0');
  const [accountIcon, setAccountIcon] = React.useState<string>(ONBOARDING_ACCOUNT_ICONS[0]);
  const [accountColor, setAccountColor] = React.useState<string>(ONBOARDING_ACCOUNT_COLORS[0]);

  React.useEffect(() => {
    if (!accountHolder.trim() && name.trim()) {
      setAccountHolder(name.trim());
    }
  }, [name, accountHolder]);

  const isPending = accountPending || categoryPending;

  const validateStep = () => {
    if (currentStep.id === 'profile' && !name.trim()) {
      Alert.alert('Missing name', 'Enter your name to continue.');
      return false;
    }

    if (currentStep.id === 'account') {
      if (!accountName.trim()) {
        Alert.alert('Missing account name', 'Enter a name for your first account.');
        return false;
      }
      if (!accountHolder.trim()) {
        Alert.alert('Missing holder name', 'Enter the holder name for this account.');
        return false;
      }
      if (!accountNumber.trim()) {
        Alert.alert('Missing account number', 'Enter an account number or identifier.');
        return false;
      }
    }

    return true;
  };

  const seedCategories = async () => {
    const defaults: { name: string; icon: string; color: number; type: 'CR' | 'DR'; budget: number; expense: number }[] = [
      // ── Income ──────────────────────────────────────────────────────
      { name: 'Salary',        icon: 'cash-outline',          color: toDbColor('#6BD498'), type: 'CR', budget: 0, expense: 0 },
      { name: 'Freelance',     icon: 'sparkles-outline',      color: toDbColor('#B8D641'), type: 'CR', budget: 0, expense: 0 },
      { name: 'Business',      icon: 'briefcase-outline',     color: toDbColor('#63A4FF'), type: 'CR', budget: 0, expense: 0 },
      { name: 'Investment',    icon: 'trending-up-outline',   color: toDbColor('#A78BFA'), type: 'CR', budget: 0, expense: 0 },
      { name: 'Rental',        icon: 'home-outline',          color: toDbColor('#34D399'), type: 'CR', budget: 0, expense: 0 },
      { name: 'Bonus',         icon: 'gift-outline',          color: toDbColor('#F9A8D4'), type: 'CR', budget: 0, expense: 0 },
      { name: 'Refund',        icon: 'refresh-outline',       color: toDbColor('#6EE7B7'), type: 'CR', budget: 0, expense: 0 },
      { name: 'Side Income',   icon: 'wallet-outline',        color: toDbColor('#FCD34D'), type: 'CR', budget: 0, expense: 0 },

      // ── Essentials ──────────────────────────────────────────────────
      { name: 'Groceries',     icon: 'basket-outline',        color: toDbColor('#F5C451'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Rent',          icon: 'business-outline',      color: toDbColor('#FF8A65'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Utilities',     icon: 'flash-outline',         color: toDbColor('#FBBF24'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Internet',      icon: 'wifi-outline',          color: toDbColor('#60A5FA'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Phone',         icon: 'phone-portrait-outline',color: toDbColor('#818CF8'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Insurance',     icon: 'shield-checkmark-outline', color: toDbColor('#6B7280'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Loan / EMI',    icon: 'card-outline',          color: toDbColor('#EF4444'), type: 'DR', budget: 0, expense: 0 },

      // ── Transport ───────────────────────────────────────────────────
      { name: 'Transport',     icon: 'car-outline',           color: toDbColor('#63A4FF'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Fuel',          icon: 'speedometer-outline',   color: toDbColor('#FB923C'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Parking',       icon: 'locate-outline',        color: toDbColor('#94A3B8'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Travel',        icon: 'airplane-outline',      color: toDbColor('#38BDF8'), type: 'DR', budget: 0, expense: 0 },

      // ── Food & Social ────────────────────────────────────────────────
      { name: 'Dining Out',    icon: 'restaurant-outline',    color: toDbColor('#F87171'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Coffee',        icon: 'cafe-outline',          color: toDbColor('#C4A35A'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Alcohol',       icon: 'wine-outline',          color: toDbColor('#C084FC'), type: 'DR', budget: 0, expense: 0 },

      // ── Health & Fitness ─────────────────────────────────────────────
      { name: 'Healthcare',    icon: 'medkit-outline',        color: toDbColor('#34D399'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Pharmacy',      icon: 'bandage-outline',       color: toDbColor('#6EE7B7'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Gym',           icon: 'barbell-outline',       color: toDbColor('#4ADE80'), type: 'DR', budget: 0, expense: 0 },

      // ── Lifestyle ────────────────────────────────────────────────────
      { name: 'Shopping',      icon: 'bag-outline',           color: toDbColor('#F472B6'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Electronics',   icon: 'hardware-chip-outline', color: toDbColor('#A5B4FC'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Subscriptions', icon: 'repeat-outline',        color: toDbColor('#C084FC'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Entertainment', icon: 'film-outline',          color: toDbColor('#FCA5A5'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Games',         icon: 'game-controller-outline', color: toDbColor('#7C3AED'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Books',         icon: 'book-outline',          color: toDbColor('#D97706'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Education',     icon: 'school-outline',        color: toDbColor('#0EA5E9'), type: 'DR', budget: 0, expense: 0 },

      // ── Home ─────────────────────────────────────────────────────────
      { name: 'Home & Garden', icon: 'leaf-outline',          color: toDbColor('#86EFAC'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Maintenance',   icon: 'build-outline',         color: toDbColor('#9CA3AF'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Furniture',     icon: 'bed-outline',           color: toDbColor('#C4B5FD'), type: 'DR', budget: 0, expense: 0 },

      // ── Personal & Other ─────────────────────────────────────────────
      { name: 'Personal Care', icon: 'cut-outline',           color: toDbColor('#F9A8D4'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Kids',          icon: 'happy-outline',         color: toDbColor('#FCD34D'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Pets',          icon: 'paw-outline',           color: toDbColor('#A3E635'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Charity',       icon: 'heart-outline',         color: toDbColor('#FB7185'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Taxes',         icon: 'document-text-outline', color: toDbColor('#6B7280'), type: 'DR', budget: 0, expense: 0 },
      { name: 'Other',         icon: 'ellipsis-horizontal-outline', color: toDbColor('#94A3B8'), type: 'DR', budget: 0, expense: 0 },
    ];

    for (const category of defaults) {
      await createCategory(category);
    }
  };

  const finalizeSetup = async () => {
    try {
      await updateProfile({
        name: name.trim(),
        email: '',
        phone: '',
        defaultCurrency,
      });

      await createAccount({
        name: accountName.trim(),
        holderName: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        icon: accountIcon.replace('-outline', ''),
        color: toDbColor(accountColor),
        isDefault: true,
        currency: defaultCurrency,
        balance: parseAmount(openingBalance),
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
    if (!validateStep()) {
      return;
    }

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
        return (
          <ProfileStep
            name={name}
            onNameChange={setName}
          />
        );
      case 'currency':
        return <CurrencyStep currency={defaultCurrency} onCurrencyChange={setDefaultCurrency} />;
      case 'account':
        return (
          <AccountStep
            accountName={accountName}
            accountHolder={accountHolder}
            accountNumber={accountNumber}
            openingBalance={openingBalance}
            defaultCurrency={defaultCurrency}
            accountIcon={accountIcon}
            accountColor={accountColor}
            profileName={name}
            onAccountNameChange={setAccountName}
            onAccountHolderChange={setAccountHolder}
            onAccountNumberChange={setAccountNumber}
            onOpeningBalanceChange={setOpeningBalance}
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
    </SafeAreaView>
  );
}
