export type OnboardingStepId = 'welcome' | 'profile' | 'currency' | 'account';

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  eyebrow: string;
  title: string;
  subtitle: string;
};
