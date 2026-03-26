import { getDeviceCurrencyCode as sharedGetDeviceCurrencyCode } from '../../constants/currency';
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
    id: 'account',
    eyebrow: 'YOUR FIRST ACCOUNT',
    title: 'Now, your first account.',
    subtitle: 'Answer a few quick questions and your starting wallet is ready.',
  },
];

export const getDeviceCurrencyCode = (): string => {
  return sharedGetDeviceCurrencyCode();
};
