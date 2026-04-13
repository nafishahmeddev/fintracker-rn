import { UseQueryResult, useQuery } from '@tanstack/react-query';
import * as api from '../api/streak.service';

export const STREAK_KEYS = {
  current: () => ['reports', 'streak'] as const,
};

/**
 * useUsageStreak: Hook to fetch the current transaction streak.
 * Useful for behavioral nudges and the Dashboard badge.
 */
export function useUsageStreak(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: STREAK_KEYS.current(),
    queryFn: () => api.getCurrentStreak(),
    // Refresh when app comes to foreground or on a regular interval
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
