import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  servicesApi,
  SwitchPayload,
  SetupSipPayload,
  SipActionPayload,
  CancelSipPayload,
  WithdrawalPayload,
  StrategyInquiryPayload,
  DiscussionPayload,
} from '@/api/services';
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
    staleTime: 60 * 60 * 1000,
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

export function useSetupSip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetupSipPayload) => servicesApi.setupSip(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
    },
  });
}

export function usePauseResumeSip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SipActionPayload) => servicesApi.pauseResumeSip(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
    },
  });
}

export function useCancelSip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CancelSipPayload) => servicesApi.cancelSip(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
    },
  });
}

export function useWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WithdrawalPayload) => servicesApi.withdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
    },
  });
}

export function useStrategyInquiry() {
  return useMutation({
    mutationFn: (payload: StrategyInquiryPayload) => servicesApi.strategyInquiry(payload),
  });
}

export function useDiscussion() {
  return useMutation({
    mutationFn: (payload: DiscussionPayload) => servicesApi.discussion(payload),
  });
}
