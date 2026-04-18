import { Platform } from 'react-native';
import { IoniconName } from '@/src/utils/icons';

export interface ProFeature {
  icon: IoniconName;
  title: string;
  description: string;
}

export const SKU_LIFETIME = Platform.select({
  ios: 'com.luno.lifetime',
  android: 'luno_lifetime',
}) || 'luno_lifetime';

export const ALL_SKUS = [SKU_LIFETIME];

export const FEATURES: ProFeature[] = [
  { icon: 'search-outline', title: 'Global Search', description: 'Instantly find any transaction, account, or category across your entire history.' },
  { icon: 'options-outline', title: 'Advanced Filters', description: 'Multi-select filters by account, category, type, date range, amount, and sort order.' },
  { icon: 'infinite', title: 'Absolute Runway', description: 'Real-time calculation of exactly how long your capital will last.' },
  { icon: 'trending-up', title: 'Burn Analytics', description: 'Identify spending velocity and anomalies before they become a problem.' },
  { icon: 'newspaper-outline', title: 'Weekly & Monthly Reports', description: 'Detailed historical summaries with performance comparisons.' },
  { icon: 'git-compare', title: 'Performance Deltas', description: 'Objective growth and burn metrics: current vs. previous period.' },
  { icon: 'cloud-outline', title: 'Backup & Restore', description: 'Export your full data to a file and restore it on any device.' },
  { icon: 'download-outline', title: 'CSV Export', description: 'Export transactions as a spreadsheet for accounting or analysis.' },
];
