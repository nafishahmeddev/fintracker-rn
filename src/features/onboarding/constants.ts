import { OnboardingStepDefinition } from './types';

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
  {
    id: 'welcome',
    eyebrow: 'FINTRACKER SETUP',
    title: 'Build your finance cockpit.',
    subtitle: 'A calm setup flow with complete defaults and clean account bootstrap.',
  },
  {
    id: 'profile',
    eyebrow: 'PROFILE',
    title: 'Who is driving this ledger?',
    subtitle: 'Your name becomes the holder default and personal context in the app.',
  },
  {
    id: 'currency',
    eyebrow: 'REGION',
    title: 'Select your base currency.',
    subtitle: 'Used as the default for onboarding account and new transactions.',
  },
  {
    id: 'account',
    eyebrow: 'FIRST ACCOUNT',
    title: 'Create your starting account.',
    subtitle: 'No placeholders. We capture the complete first account setup here.',
  },
];

export const ONBOARDING_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'INR', 'AED'] as const;

export const ONBOARDING_ACCOUNT_ICONS = [
  'wallet-outline',
  'card-outline',
  'cash-outline',
  'business-outline',
  'server-outline',
  'diamond-outline',
] as const;

export const ONBOARDING_ACCOUNT_COLORS = ['#6BD498', '#8DECB8', '#3FBF7F', '#F5C451', '#63A4FF', '#FF8A65'] as const;
