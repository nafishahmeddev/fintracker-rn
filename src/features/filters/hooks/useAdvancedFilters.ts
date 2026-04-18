import { useMemo } from 'react';
import { TransactionListItem } from '@/src/features/transactions/api/transactions';
import { useInfiniteTransactions } from '@/src/features/transactions/hooks/transactions';
import { AdvancedFilters } from '../api/advanced-filters.service';

interface UseAdvancedFiltersResult {
  transactions: TransactionListItem[];
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  totalCount: number;
}

/**
 * Hook for applying advanced filters to transactions
 * Handles both server-side and client-side filtering
 */
export function useAdvancedFilters(
  filters: AdvancedFilters
): UseAdvancedFiltersResult {
  // Use basic filters for server-side filtering
  const basicFilters = useMemo(() => {
    const result: Record<string, unknown> = {};
    
    // Only pass single selections to server
    if (filters.types?.length === 1) {
      result.type = filters.types[0];
    }
    if (filters.accountIds?.length === 1) {
      result.accountId = filters.accountIds[0];
    }
    if (filters.categoryIds?.length === 1) {
      result.categoryId = filters.categoryIds[0];
    }
    
    return result;
  }, [filters.types, filters.accountIds, filters.categoryIds]);

  // Fetch transactions with basic filters
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTransactions(basicFilters);

  // Apply client-side filtering for advanced features
  const filteredTransactions = useMemo(() => {
    const allTransactions = data?.pages.flat() ?? [];
    
    return allTransactions.filter((transaction) => {
      // Date range filter
      if (filters.dateRange) {
        const txDate = new Date(transaction.datetime);
        const startDate = new Date(filters.dateRange.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        if (txDate < startDate || txDate > endDate) {
          return false;
        }
      }
      
      // Multi-select type filter
      if (filters.types && filters.types.length > 0) {
        if (!filters.types.includes(transaction.type)) {
          return false;
        }
      }
      
      // Multi-select account filter
      if (filters.accountIds && filters.accountIds.length > 0) {
        if (!filters.accountIds.includes(transaction.accountId)) {
          return false;
        }
      }
      
      // Multi-select category filter
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        if (!filters.categoryIds.includes(transaction.categoryId)) {
          return false;
        }
      }
      
      // Amount range filter
      if (filters.amountRange) {
        const amount = transaction.amount;
        if (filters.amountRange.min !== undefined && amount < filters.amountRange.min) {
          return false;
        }
        if (filters.amountRange.max !== undefined && amount > filters.amountRange.max) {
          return false;
        }
      }
      
      // Search in notes
      if (filters.searchQuery?.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const noteMatch = transaction.note.toLowerCase().includes(query);
        const categoryMatch = transaction.category.name.toLowerCase().includes(query);
        const accountMatch = transaction.account.name.toLowerCase().includes(query);
        
        if (!noteMatch && !categoryMatch && !accountMatch) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by selected criteria
      if (filters.sortBy === 'amount') {
        return filters.sortOrder === 'asc' 
          ? a.amount - b.amount 
          : b.amount - a.amount;
      }
      
      // Default sort by date
      const dateA = new Date(a.datetime).getTime();
      const dateB = new Date(b.datetime).getTime();
      return filters.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [data?.pages, filters]);

  return {
    transactions: filteredTransactions,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
    totalCount: filteredTransactions.length,
  };
}
