import { useQuery } from '@tanstack/react-query';
import * as api from '../api/dashboard';
import * as insightsApi from '../api/insights';

export const DASHBOARD_KEYS = {
  stats: (currency: string) => ['dashboard', 'stats', currency] as const,
  topCategories: (currency: string) => ['dashboard', 'top-categories', currency] as const,
  insights: (currency: string) => ['dashboard', 'insights', currency] as const,
};

export const useDashboardStats = (currency: string) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stats(currency),
    queryFn: () => api.getDashboardStats(currency),
    enabled: !!currency,
  });
};

export const useTopExpenseCategories = (currency: string) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.topCategories(currency),
    queryFn: () => api.getTopExpenseCategories(currency),
    enabled: !!currency,
  });
};

export const useDashboardInsights = (currency: string) => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.insights(currency),
    queryFn: () => insightsApi.getDashboardInsights(currency),
    enabled: !!currency,
  });
};
