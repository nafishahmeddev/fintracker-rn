import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/transactions';

export const TRANSACTIONS_KEYS = {
  all: ['transactions'] as const,
  paged: (filters: api.TransactionFilters) => ['transactions', 'paged', filters] as const,
  count: (filters: api.TransactionFilters) => ['transactions', 'count', filters] as const,
  byId: (id: number) => ['transactions', 'by-id', id] as const,
};

/** Full fetch — used by stats screen */
export const useTransactions = () => {
  return useQuery({
    queryKey: TRANSACTIONS_KEYS.all,
    queryFn: api.getTransactions,
  });
};

/** Infinite paginated fetch — used by the transactions list screen */
export const useInfiniteTransactions = (filters: api.TransactionFilters = {}) => {
  return useInfiniteQuery({
    queryKey: TRANSACTIONS_KEYS.paged(filters),
    queryFn: ({ pageParam }) => api.getTransactionsPaged(pageParam, filters),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === api.PAGE_SIZE ? allPages.length : undefined,
  });
};

export const useTransactionsCount = (filters: api.TransactionFilters = {}) => {
  return useQuery({
    queryKey: TRANSACTIONS_KEYS.count(filters),
    queryFn: () => api.getTransactionsCount(filters),
  });
};

export const useTransactionById = (id?: number | null) => {
  return useQuery({
    queryKey: id != null ? TRANSACTIONS_KEYS.byId(id) : ['transactions', 'by-id', 'disabled'],
    queryFn: () => api.getTransactionById(id as number),
    enabled: id != null,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdatePayment }) =>
      api.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
