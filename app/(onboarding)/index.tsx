import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { ThemeColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useOnboarding } from '../../src/providers/OnboardingProvider';
import { useSettings } from '../../src/providers/SettingsProvider';
import { useCreateAccount } from '../../src/features/accounts/hooks/accounts';
import { useCreateCategory } from '../../src/features/categories/hooks/categories';

const ONBOARDING_SLIDES = [
  { id: '1', type: 'info', title: 'Track Your Finances', subtitle: 'Premium tools to manage your wealth and expenses seamlessly.', emoji: '📈' },
  { id: '2', type: 'info', title: 'Smart Categories', subtitle: 'Organize your income and expenses precisely with intelligent budgeting.', emoji: '🗂' },
  { id: '3', type: 'info', title: 'Multi-Currency', subtitle: 'Travel the world without losing track of your global portfolio.', emoji: '🌍' },
  { id: '4', type: 'profile', title: 'Who are you?', subtitle: 'Let us personalize your dashboard.' },
  { id: '5', type: 'currency', title: 'Default Currency', subtitle: 'What is your primary operating currency?' },
  { id: '6', type: 'account', title: 'First Account', subtitle: 'Set up your primary wallet to get started.' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'INR', 'BGN'];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  
  const { completeOnboarding } = useOnboarding();
  const { updateProfile } = useSettings();
  const { mutateAsync: createAccount, isPending: loadingAccount } = useCreateAccount();
  const { mutateAsync: createCategory, isPending: loadingCategory } = useCreateCategory();

  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [accountName, setAccountName] = useState('Main Wallet');
  const [balance, setBalance] = useState('0');

  const handleNext = async () => {
    // Validation Overrides
    if (currentIndex === 3 && !name.trim()) {
      alert("Please provide your name.");
      return;
    }
    if (currentIndex === 5) {
      if (!accountName.trim() || !balance.trim()) {
        alert("Please provide valid account initialization details.");
        return;
      }
      return finalizeSetup();
    }

    // Progress Iteration
    const nextIndex = currentIndex + 1;
    if (nextIndex < ONBOARDING_SLIDES.length) {
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      listRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  const finalizeSetup = async () => {
    try {
      // 1. Commit Profile asynchronously
      await updateProfile({ name, email, phone, defaultCurrency });

      // 2. Initialize Core Account
      await createAccount({
        name: accountName,
        holderName: name,
        accountNumber: 'N/A',
        icon: 'wallet',
        color: parseInt(colors.primary.replace('#', '0x')),
        isDefault: true,
        currency: defaultCurrency,
        balance: parseFloat(balance),
        income: 0,
        expense: 0,
      });

      // 3. Seed Default Categories
      const standardCategories = [
        { name: 'Salary', icon: 'cash', color: parseInt(colors.success.replace('#', '0x')), type: 'CR' as const, budget: 0, expense: 0 },
        { name: 'Groceries', icon: 'cart', color: parseInt(colors.warning.replace('#', '0x')), type: 'DR' as const, budget: 0, expense: 0 },
        { name: 'Transport', icon: 'car', color: parseInt(colors.primary.replace('#', '0x')), type: 'DR' as const, budget: 0, expense: 0 },
        { name: 'Entertainment', icon: 'film', color: parseInt(colors.danger.replace('#', '0x')), type: 'DR' as const, budget: 0, expense: 0 },
      ];

      for (const cat of standardCategories) {
        await createCategory(cat);
      }

      // 4. Conclude Context
      await completeOnboarding();
      router.replace('/(tabs)');
    } catch {
      alert("System failed to initialize profile environment.");
    }
  };

  const renderSlide = ({ item, index }: { item: typeof ONBOARDING_SLIDES[0], index: number }) => {
    return (
      <View style={[styles.slide, { width }]}>
        {item.type === 'info' && (
          <View style={styles.centerContent}>
            <View style={styles.iconPlaceholder}>
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}

        {item.type === 'profile' && (
          <View style={styles.formContent}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <View style={styles.inputGroup}>
              <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} />
              <Input label="Email Address" placeholder="john@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Input label="Phone Number (Optional)" placeholder="+1 234 567 890" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>
        )}

        {item.type === 'currency' && (
          <View style={styles.formContent}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <View style={styles.currencyGrid}>
              {CURRENCIES.map((cur) => {
                const isSelected = defaultCurrency === cur;
                return (
                  <TouchableOpacity 
                    key={cur} 
                    style={[styles.currencyBox, isSelected && { borderColor: colors.primary, backgroundColor: colors.primary + '15' }]}
                    onPress={() => setDefaultCurrency(cur)}
                  >
                    <Text style={[styles.currencyText, isSelected && { color: colors.primary, fontWeight: typography.weights.bold }]}>{cur}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {item.type === 'account' && (
          <View style={styles.formContent}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <View style={styles.inputGroup}>
              <Input label="Wallet Name" placeholder="e.g. Checking Account" value={accountName} onChangeText={setAccountName} />
              <Input label={`Starting Balance (${defaultCurrency})`} placeholder="0.00" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
            </View>
          </View>
        )}
      </View>
    );
  };

  const isPending = loadingAccount || loadingCategory;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Navigation Indicator / Back */}
        <View style={styles.header}>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ) : <View style={styles.backBtnWrapper} />}
          
          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES.map((_, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.dot, 
                  idx === currentIndex ? { backgroundColor: colors.primary, width: 24 } : { backgroundColor: colors.border }
                ]} 
              />
            ))}
          </View>
          
          <View style={styles.backBtnWrapper} />
        </View>

        <FlatList
          ref={listRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false} // Force using buttons to navigate
        />

        <View style={styles.footer}>
          <Button 
            title={currentIndex === ONBOARDING_SLIDES.length - 1 ? "Finish Setup" : "Continue"} 
            onPress={handleNext} 
            size="lg" 
            isLoading={isPending}
            style={styles.button}
          />
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backBtnWrapper: {
    width: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  slide: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  formContent: {
    flex: 1,
    justifyContent: 'center',
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  inputGroup: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 16,
  },
  currencyBox: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  currencyText: {
    fontSize: typography.sizes.lg,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  footer: {
    padding: 32,
    paddingBottom: Platform.OS === 'ios' ? 16 : 32,
  },
  button: {
    width: '100%',
  },
});
