import { UseQueryResult, useQuery } from '@tanstack/react-query';
import * as api from '../api/reports.service';
import { ReportData } from '../api/reports.service';

export const REPORT_KEYS = {
  weekly: (currency: string) => ['reports', 'weekly', currency] as const,
  monthly: (currency: string) => ['reports', 'monthly', currency] as const,
};

/**
 * useWeeklyReport: Hook to fetch aggregated data for the weekly journalistic report.
 */
export function useWeeklyReport(currency: string): UseQueryResult<ReportData, Error> {
  return useQuery({
    queryKey: REPORT_KEYS.weekly(currency),
    queryFn: () => api.getWeeklyReport(currency),
    enabled: !!currency,
  });
}

/**
 * useMonthlyReport: Hook to fetch aggregated data for the monthly calendar summary.
 */
export function useMonthlyReport(currency: string): UseQueryResult<ReportData, Error> {
  return useQuery({
    queryKey: REPORT_KEYS.monthly(currency),
    queryFn: () => api.getMonthlyReport(currency),
    enabled: !!currency,
  });
}
