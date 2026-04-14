import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettings } from '../../../providers/SettingsProvider';
import { NotificationService } from '../../../services/notification.service';
import * as api from '../api/transactions';

export const TRANSACTIONS_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTIONS_KEYS.all, 'list'] as const,
  list: (filters: api.TransactionFilters) => [...TRANSACTIONS_KEYS.lists(), { filters }] as const,
  details: () => [...TRANSACTIONS_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...TRANSACTIONS_KEYS.details(), id] as const,
  count: (filters: api.TransactionFilters) => [...TRANSACTIONS_KEYS.all, 'count', { filters }] as const,
};

/** Fetch recent transactions — used by stats screen or dashboard */
export const useTransactions = (limit: number = 20, filters: api.TransactionFilters = {}) => {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEYS.lists(), 'limited', limit, filters],
    queryFn: () => api.getTransactions(limit, filters),
  });
};

/** Infinite paginated fetch — used by the transactions list screen */
export const useInfiniteTransactions = (filters: api.TransactionFilters = {}) => {
  return useInfiniteQuery({
    queryKey: TRANSACTIONS_KEYS.list(filters),
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
    queryKey: id != null ? TRANSACTIONS_KEYS.detail(id) : ['transactions', 'detail', 'disabled'],
    queryFn: () => api.getTransactionById(id as number),
    enabled: id != null,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { profile } = useSettings();

  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: () => {
      // Smart Notification dismissal
      if (profile.reminderEnabled) {
        NotificationService.dismissToday(profile.reminderTime);
      }

      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: api.UpdatePayment }) =>
      api.updateTransaction(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
