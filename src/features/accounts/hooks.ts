import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

const ACCOUNTS_KEYS = {
  all: ['accounts'] as const,
};

export const useAccounts = () => {
  return useQuery({
    queryKey: ACCOUNTS_KEYS.all,
    queryFn: api.getAccounts,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.all });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<api.InsertAccount> }) => 
      api.updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.all });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.all });
    },
  });
};
