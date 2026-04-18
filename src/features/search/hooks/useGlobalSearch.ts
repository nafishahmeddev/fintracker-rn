import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { globalSearch } from '../api/global-search';

const SEARCH_KEYS = {
  all: ['globalSearch'] as const,
  results: (query: string) => [...SEARCH_KEYS.all, query] as const,
};

export function useGlobalSearch(rawQuery: string) {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const isEnabled = debouncedQuery.length >= 2;

  return {
    ...useQuery({
      queryKey: SEARCH_KEYS.results(debouncedQuery),
      queryFn: () => globalSearch(debouncedQuery),
      enabled: isEnabled,
      staleTime: 15_000,
      placeholderData: (prev) => prev,
    }),
    isEnabled,
    debouncedQuery,
  };
}
