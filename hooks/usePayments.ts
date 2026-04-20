import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, CreateOrderPayload, VerifyOrderResponse, VerifySipResponse } from '@/api/payments';
import { useAuthStore } from '@/store/authStore';

export function useInvestmentStatus() {
  const accountId = useAuthStore((s) => s.selectedAccountId);

  return useQuery({
    queryKey: ['payments', 'investment-status', accountId],
    queryFn: () => paymentsApi.getInvestmentStatus(accountId ?? undefined),
    staleTime: 2 * 60 * 1000,
    enabled: !!accountId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => paymentsApi.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
    },
  });
}

export function useVerifyOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => paymentsApi.verifyOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
    },
  });
}

export function useVerifySip() {
  const queryClient = useQueryClient();

  return useMutation<VerifySipResponse, Error, string>({
    mutationFn: (subscriptionId: string) => paymentsApi.verifySip(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
      queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
    },
  });
}
