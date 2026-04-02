import { Platform } from 'react-native';

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
