import { Ionicons } from '@expo/vector-icons';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../src/components/ui/Button';
import { useCreateAccount } from '../../src/features/accounts/hooks/accounts';
import { useCreateCategory } from '../../src/features/categories/hooks/categories';
import { AccountStep } from '../../src/features/onboarding/components/AccountStep';
import { CurrencyStep } from '../../src/features/onboarding/components/CurrencyStep';
import { ProfileStep } from '../../src/features/onboarding/components/ProfileStep';
import { WelcomeStep } from '../../src/features/onboarding/components/WelcomeStep';
import { ONBOARDING_ACCOUNT_COLORS, ONBOARDING_ACCOUNT_ICONS, ONBOARDING_STEPS } from '../../src/features/onboarding/constants';
import { createOnboardingStyles } from '../../src/features/onboarding/styles';
import { parseAmount, toDbColor } from '../../src/features/onboarding/utils';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useTheme } from '../../src/providers/ThemeProvider';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => createOnboardingStyles(colors), [colors]);
  const { completeOnboarding } = useOnboarding();
  const { updateProfile } = useSettings();
  const { mutateAsync: createAccount, isPending: accountPending } = useCreateAccount();
  const { mutateAsync: createCategory, isPending: categoryPending } = useCreateCategory();

  const [stepIndex, setStepIndex] = React.useState(0);
  const currentStep = ONBOARDING_STEPS[stepIndex];

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [defaultCurrency, setDefaultCurrency] = React.useState<string>('USD');
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
    const defaults = [
      { name: 'Salary', icon: 'cash-outline', color: toDbColor(colors.success), type: 'CR' as const, budget: 0, expense: 0 },
      { name: 'Freelance', icon: 'sparkles-outline', color: toDbColor(colors.primary), type: 'CR' as const, budget: 0, expense: 0 },
      { name: 'Groceries', icon: 'basket-outline', color: toDbColor('#F5C451'), type: 'DR' as const, budget: 0, expense: 0 },
      { name: 'Transport', icon: 'car-outline', color: toDbColor('#63A4FF'), type: 'DR' as const, budget: 0, expense: 0 },
      { name: 'Bills', icon: 'receipt-outline', color: toDbColor('#FF8A65'), type: 'DR' as const, budget: 0, expense: 0 },
    ];

    for (const category of defaults) {
      await createCategory(category);
    }
  };

  const finalizeSetup = async () => {
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
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
            email={email}
            phone={phone}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
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
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={[styles.bgCircle, { top: -70, left: -70, width: 280, height: 280, backgroundColor: colors.primary + '26' }]} />
        <View style={[styles.bgCircle, { top: 240, right: -120, width: 360, height: 360, backgroundColor: colors.primary + '18' }]} />
        <View style={[styles.bgCircle, { bottom: -110, left: 30, width: 320, height: 320, backgroundColor: colors.secondary + '10' }]} />
      </View>

      <BlurView
        blurAmount={Platform.OS === 'ios' ? 70 : 92}
        blurType={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      {Platform.OS === 'android' ? (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.background + '76' }]} pointerEvents="none" />
      ) : null}

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
