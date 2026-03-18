import { useQuery } from '@tanstack/react-query';
import { portfolioApi } from '@/api/portfolio';
import { useAuthStore } from '@/store/authStore';
import { usePortfolioStore } from '@/store/portfolioStore';

const STALE = 10 * 60 * 1000; // 10 minutes

export function usePortfolioPerformance() {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const strategy = useAuthStore((s) => s.selectedStrategy);
  const strategyParam = strategy === 'all' ? null : strategy;

  return useQuery({
    queryKey: ['portfolio', 'performance', accountId, strategyParam],
    queryFn: () =>
      portfolioApi.getPerformance({
        accountId: accountId ?? undefined,
        ...(strategyParam ? { strategy: strategyParam } : {}),
      }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useNAVData() {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const strategy = useAuthStore((s) => s.selectedStrategy);
  const period = usePortfolioStore((s) => s.selectedPeriod);
  const strategyParam = strategy === 'all' ? null : strategy;

  return useQuery({
    queryKey: ['portfolio', 'nav', accountId, strategyParam, period],
    queryFn: () =>
      portfolioApi.getNAV({
        accountId: accountId ?? undefined,
        ...(strategyParam ? { strategy: strategyParam } : {}),
        period,
      }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useDrawdownData() {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const strategy = useAuthStore((s) => s.selectedStrategy);
  const period = usePortfolioStore((s) => s.selectedPeriod);
  const strategyParam = strategy === 'all' ? null : strategy;

  return useQuery({
    queryKey: ['portfolio', 'drawdown', accountId, strategyParam, period],
    queryFn: () =>
      portfolioApi.getDrawdown({
        accountId: accountId ?? undefined,
        ...(strategyParam ? { strategy: strategyParam } : {}),
        period,
      }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useQuarterlyPL() {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const strategy = useAuthStore((s) => s.selectedStrategy);
  const strategyParam = strategy === 'all' ? null : strategy;

  return useQuery({
    queryKey: ['portfolio', 'quarterly-pl', accountId, strategyParam],
    queryFn: () =>
      portfolioApi.getQuarterlyPL({
        accountId: accountId ?? undefined,
        ...(strategyParam ? { strategy: strategyParam } : {}),
      }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useMonthlyPL() {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const strategy = useAuthStore((s) => s.selectedStrategy);
  const strategyParam = strategy === 'all' ? null : strategy;

  return useQuery({
    queryKey: ['portfolio', 'monthly-pl', accountId, strategyParam],
    queryFn: () =>
      portfolioApi.getMonthlyPL({
        accountId: accountId ?? undefined,
        ...(strategyParam ? { strategy: strategyParam } : {}),
      }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useCashFlow() {
  const accountId = useAuthStore((s) => s.selectedAccountId);

  return useQuery({
    queryKey: ['portfolio', 'cashflow', accountId],
    queryFn: () =>
      portfolioApi.getCashFlow({ accountId: accountId ?? undefined }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function usePortfolioSnapshot() {
  return useQuery({
    queryKey: ['portfolio', 'snapshot'],
    queryFn: portfolioApi.getSnapshot,
    staleTime: STALE,
  });
}
