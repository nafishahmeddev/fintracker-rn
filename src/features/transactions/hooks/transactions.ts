import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/transactions';

export const TRANSACTIONS_KEYS = {
  all: ['transactions'] as const,
};

export const useTransactions = () => {
  return useQuery({
    queryKey: TRANSACTIONS_KEYS.all,
    queryFn: api.getTransactions,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEYS.all });
      // Invalidate accounts and categories since balances might have changed (if we handled it)
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
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
    },
  });
};
