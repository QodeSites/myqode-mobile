import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { servicesApi, AddFundsPayload, SwitchPayload } from '@/api/services';
import { useAuthStore } from '@/store/authStore';

export function useTransactions() {
  const accountId = useAuthStore((s) => s.selectedAccountId);

  return useQuery({
    queryKey: ['services', 'transactions', accountId],
    queryFn: () => servicesApi.getTransactions(accountId ?? undefined),
    staleTime: 2 * 60 * 1000,
    enabled: !!accountId,
  });
}

export function useBankDetails() {
  return useQuery({
    queryKey: ['services', 'bank-details'],
    queryFn: servicesApi.getBankDetails,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useAddFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddFundsPayload) => servicesApi.addFunds(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
    },
  });
}

export function useSwitchStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SwitchPayload) => servicesApi.switchStrategy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}
