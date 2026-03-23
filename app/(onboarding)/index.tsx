import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { Button } from '../../src/components/ui/Button';
import { useOnboarding } from '../../src/providers/OnboardingProvider';

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconPlaceholder}>
          <Text style={styles.emoji}>📈</Text>
        </View>
        <Text style={styles.title}>Track Your Finances, Seamlessly.</Text>
        <Text style={styles.subtitle}>
          Take control of your money with our premium dashboard and instant transaction syncing.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button 
          title="Get Started" 
          onPress={handleGetStarted} 
          size="lg" 
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
    fontWeight: typography.weights.bold as any,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 32,
    paddingBottom: 48,
  },
  button: {
    width: '100%',
  },
});
