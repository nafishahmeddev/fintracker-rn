import { Platform } from 'react-native';
import { PlanType } from '../providers/SubscriptionProvider';

export interface ProFeature {
  icon: string;
  title: string;
  description: string;
}

export interface MappedPlan {
  id: PlanType;
  sku: string;
  name: string;
  period: string;
  badge: string | null;
  price: string;
  originalPrice: string | null;
}

export const SKU_MONTHLY = Platform.select({
  ios: 'com.luno.monthly',
  android: 'luno_monthly',
}) || 'luno_monthly';

export const SKU_YEARLY = Platform.select({
  ios: 'com.luno.yearly',
  android: 'luno_yearly',
}) || 'luno_yearly';

export const SKU_LIFETIME = Platform.select({
  ios: 'com.luno.lifetime',
  android: 'luno_lifetime',
}) || 'luno_lifetime';

export const ALL_SKUS = [SKU_MONTHLY, SKU_YEARLY, SKU_LIFETIME];

export const FEATURES: ProFeature[] = [
  { icon: 'infinite', title: 'Absolute Runway', description: 'Real-time calculation of exactly how long your capital will last.' },
  { icon: 'trending-up', title: 'Advanced Burn Analytics', description: 'Identifying spending velocity and anomalies before they trend.' },
  { icon: 'calendar', title: 'Universal Time Filters', description: 'Deep historical perspective with 7D, 30D, 90D, and All-Time windowing.' },
  { icon: 'pie-chart', title: 'Sector Distribution', description: 'Precision multi-account breakdown across your entire asset portfolio.' },
  { icon: 'git-compare', title: 'Performance Deltas', description: 'Objective growth and burn metrics: current vs. previous period.' },
  { icon: 'shield-checkmark', title: 'Secure & Private', description: 'Native transactions. Your data stays on your device, always.' },
  { icon: 'cloud-offline-outline', title: 'Local-First Architecture', description: 'Engineered for speed and reliability. Access all your data instantly, even without an internet connection.' },
  { icon: 'color-palette-outline', title: 'Editorial Aesthetics', description: 'A premium, high-contrast design system optimized for clarity and focus on what matters.' },
];
