import { useQuery } from '@tanstack/react-query';
import { portfolioApi, SnapshotNode } from '@/api/portfolio';
import { useAuthStore } from '@/store/authStore';
import { usePortfolioStore } from '@/store/portfolioStore';


const STALE = 10 * 60 * 1000; // 10 minutes

// All hooks use a single accountId (individual account code, ownerId, or groupId).
// The API routes query pms_master_sheet WHERE account_code = $1, which works for
// pre-computed aggregate rows (ownerId/groupId) exactly the same as individual rows —
// matching the web version's approach.

export function usePortfolioPerformance() {
  const accountId = useAuthStore((s) => s.selectedAccountId);

  return useQuery({
    queryKey: ['portfolio', 'performance', accountId],
    queryFn: () => portfolioApi.getPerformance({ accountId: accountId ?? undefined }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useNAVData() {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const period = usePortfolioStore((s) => s.selectedPeriod);

  return useQuery({
    queryKey: ['portfolio', 'nav', accountId, period],
    queryFn: () => portfolioApi.getNAV({ accountId: accountId ?? undefined, period }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useDrawdownData() {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const period = usePortfolioStore((s) => s.selectedPeriod);

  return useQuery({
    queryKey: ['portfolio', 'drawdown', accountId, period],
    queryFn: () => portfolioApi.getDrawdown({ accountId: accountId ?? undefined, period }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useQuarterlyPL() {
  const accountId = useAuthStore((s) => s.selectedAccountId);

  return useQuery({
    queryKey: ['portfolio', 'quarterly-pl', accountId],
    queryFn: () => portfolioApi.getQuarterlyPL({ accountId: accountId ?? undefined }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useMonthlyPL() {
  const accountId = useAuthStore((s) => s.selectedAccountId);

  return useQuery({
    queryKey: ['portfolio', 'monthly-pl', accountId],
    queryFn: () => portfolioApi.getMonthlyPL({ accountId: accountId ?? undefined }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function useCashFlow() {
  const accountId = useAuthStore((s) => s.selectedAccountId);

  return useQuery({
    queryKey: ['portfolio', 'cashflow', accountId],
    queryFn: () => portfolioApi.getCashFlow({ accountId: accountId ?? undefined }),
    staleTime: STALE,
    enabled: !!accountId,
  });
}

export function usePortfolioSnapshot() {
  // Only fire once the auth token is available — prevents spurious 401s on startup
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['portfolio', 'snapshot'],
    queryFn: portfolioApi.getSnapshot,
    staleTime: STALE,
    enabled: !!token,
  });
}

function findNodeById(node: SnapshotNode, id: string): SnapshotNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function useIsSelectedAccountClosed(): boolean {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  const accountIds = useAuthStore((s) => s.selectedAccountIds);
  const { data: snapshot } = usePortfolioSnapshot();
  if (!snapshot) return false;
  // Owner scope (Level 2) and family scope (Level 1) are never "closed"
  if (accountIds != null) return false;
  if (!accountId) return false;
  const ownerIds = snapshot.ownerIds ?? [];
  const groupId = snapshot.groupId;
  if (ownerIds.includes(accountId) || accountId === groupId) return false;
  const node = findNodeById(snapshot, accountId);
  return node?.isClosed || node?.status === 'closed' || false;
}
