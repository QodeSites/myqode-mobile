import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface PerformanceParams {
  accountId?: string;
  strategy?: string;
}

export interface PerformanceData {
  amountInvested: number | null;
  currentValue: number | null;
  totalReturns: number | null;
  returnsPercent: number | null;
  cagr: number | null;
  inceptionDate: string | null;
  dataAsOf: string | null;
  grossValue?: number | null;
  isNegative?: boolean;
  isClosed?: boolean;
  closedAt?: string | null;
  trailingReturns: TrailingReturn[];
}

export interface TrailingReturn {
  name: string;
  type: 'portfolio' | 'benchmark';
  w1?: number | null;
  d10?: number | null;
  m1?: number | null;
  m3?: number | null;
  m6?: number | null;
  y1?: number | null;
  y3?: number | null;
  currentDD?: number | null;
  maxDD?: number | null;
  sinceInception?: number | null;
}

interface TrailingReturnsRaw {
  portfolio?: Omit<TrailingReturn, 'name' | 'type'>;
  benchmark?: Omit<TrailingReturn, 'name' | 'type'>;
  nifty50?: Omit<TrailingReturn, 'name' | 'type'>;
  [key: string]: Omit<TrailingReturn, 'name' | 'type'> | undefined;
}

export interface NAVDataPoint {
  date: string;
  portfolioNav: number;
  benchmarkNav: number;
}

export interface DrawdownDataPoint {
  date: string;
  portfolioDD: number;
  benchmarkDD: number;
}

export interface QuarterlyPL {
  year: number;
  q1?: number | null;
  q2?: number | null;
  q3?: number | null;
  q4?: number | null;
  total?: number | null;
}

export interface MonthlyPL {
  year: number;
  jan?: number | null;
  feb?: number | null;
  mar?: number | null;
  apr?: number | null;
  may?: number | null;
  jun?: number | null;
  jul?: number | null;
  aug?: number | null;
  sep?: number | null;
  oct?: number | null;
  nov?: number | null;
  dec?: number | null;
  total?: number | null;
}

export interface CashFlowItem {
  date: string;
  amount: number;
  type: 'inflow' | 'outflow';
  formattedAmount?: string;
}

export interface SnapshotAccount {
  id: string;
  type: string;
  clientId: string;
  lastUpdated: string;
  portfolioValue: number;
  status: 'active' | 'closed' | 'pending' | 'dormant' | string;
  isClosed?: boolean;
  mobile?: string;
  strategyPrefix?: string;
  strategyName?: string;
  strategyColor?: string;
}

export interface SnapshotOwner {
  id: string;
  name: string;
  email: string;
  groupId?: string;
  isHeadOfFamily?: boolean;
  totalValue: number;
  accounts: SnapshotAccount[];
}

export interface SnapshotData {
  owners: SnapshotOwner[];
  totalPortfolioValue: number;
  formattedTotal: string;
  activeAccountCount: number;
  isHeadOfFamily?: boolean;
  groupId?: string;
}

// Legacy tree node shape kept for SnapshotRow component compatibility
export interface SnapshotNode {
  id: string;
  label: string;
  type: 'owner' | 'person' | 'account';
  totalValue: number;
  children?: SnapshotNode[];
  clientId?: string;
  email?: string;
  mobile?: string;
  lastUpdated?: string;
  status?: 'active' | 'closed' | 'pending' | 'dormant' | string;
  isClosed?: boolean;
  accountType?: string;
  strategyPrefix?: string;
  strategyName?: string;
  strategyColor?: string;
  // Root-level only: owner and group IDs for scope selection
  ownerIds?: string[];
  groupId?: string | null;
  isHeadOfFamily?: boolean;
}

export const portfolioApi = {
  getPerformance: async (params: PerformanceParams) => {
    const res = await apiClient.get<Omit<PerformanceData, 'trailingReturns'> & { trailingReturns: TrailingReturnsRaw }>(ENDPOINTS.PERFORMANCE, { params });
    const raw = res.data;
    const benchmarkName = (raw as any).strategy?.benchmark ?? 'Benchmark';
    const trailingReturns: TrailingReturn[] = Object.entries(raw.trailingReturns ?? {})
      .filter(([key]) => key === 'portfolio' || key === 'nifty50' || key === 'benchmark')
      .map(([key, values]) => ({
        name: key === 'portfolio' ? 'Portfolio' : key === 'nifty50' ? 'Nifty 50' : benchmarkName,
        type: key === 'portfolio' ? 'portfolio' : 'benchmark',
        ...(values as object),
      }));
    return { ...raw, trailingReturns };
  },

  getNAV: async (params: PerformanceParams & { period?: string }) => {
    const res = await apiClient.get<{ period?: string; strategy?: { benchmark?: string }; series: { date: string; portfolio?: number; benchmark?: number; nifty50?: number }[] }>(ENDPOINTS.NAV, { params });
    const series = res.data?.series ?? [];
    const benchmarkName = res.data?.strategy?.benchmark ?? 'Benchmark';
    const data = series.map((d) => ({
      date: d.date,
      portfolioNav: d.portfolio ?? 0,
      benchmarkNav: d.benchmark ?? (d as any).nifty50 ?? 0,
    })) as NAVDataPoint[];
    return { data, benchmarkName };
  },

  getDrawdown: async (params: PerformanceParams & { period?: string }) => {
    const res = await apiClient.get<{ period?: string; strategy?: { benchmark?: string }; series: { date: string; portfolio?: number; benchmark?: number; nifty50?: number }[] }>(ENDPOINTS.DRAWDOWN, { params });
    const series = res.data?.series ?? [];
    const benchmarkName = res.data?.strategy?.benchmark ?? 'Benchmark';
    const data = series.map((d) => ({
      date: d.date,
      portfolioDD: d.portfolio ?? 0,
      benchmarkDD: d.benchmark ?? (d as any).nifty50 ?? 0,
    })) as DrawdownDataPoint[];
    return { data, benchmarkName };
  },

  getQuarterlyPL: async (params: PerformanceParams) => {
    const res = await apiClient.get<{ percentData: QuarterlyPL[]; rupeeData: QuarterlyPL[] }>(ENDPOINTS.QUARTERLY_PL, { params });
    return res.data;
  },

  getMonthlyPL: async (params: PerformanceParams) => {
    const res = await apiClient.get<{ percentData: MonthlyPL[]; rupeeData: MonthlyPL[] }>(ENDPOINTS.MONTHLY_PL, { params });
    return res.data;
  },

  getCashFlow: async (params: PerformanceParams) => {
    const res = await apiClient.get<{ transactions: CashFlowItem[]; total: number; formattedTotal: string }>(ENDPOINTS.CASHFLOW, { params });
    return res.data;
  },

  // Combined (owner/group scope): now accepts a single accountId (ownerId or groupId).
  // The backend queries pre-computed aggregate rows in pms_master_sheet WHERE account_code = accountId,
  // matching the web version's approach instead of runtime SUM aggregation.
  getCombinedPerformance: async (params: { accountId: string }) => {
    const res = await apiClient.get<any>(ENDPOINTS.COMBINED_PERFORMANCE, { params });
    const raw = res.data;
    const benchmarkName = (raw as any).strategy?.benchmark ?? 'Nifty 50';
    const trailingReturns: TrailingReturn[] = Object.entries(raw.trailingReturns ?? {})
      .filter(([key]) => key === 'portfolio' || key === 'nifty50' || key === 'benchmark')
      .map(([key, values]) => ({
        name: key === 'portfolio' ? 'Portfolio' : key === 'nifty50' ? 'Nifty 50' : benchmarkName,
        type: key === 'portfolio' ? 'portfolio' : 'benchmark',
        ...(values as object),
      }));
    return { ...raw, trailingReturns };
  },

  getCombinedNAV: async (params: { accountId: string; period?: string }) => {
    const res = await apiClient.get<{ period?: string; strategy?: { benchmark?: string }; series: { date: string; portfolio?: number; benchmark?: number | null }[] }>(ENDPOINTS.COMBINED_NAV, { params });
    const series = res.data?.series ?? [];
    const benchmarkName = res.data?.strategy?.benchmark ?? 'Nifty 50';
    const data = series.map((d) => ({
      date: d.date,
      portfolioNav: d.portfolio ?? 0,
      benchmarkNav: d.benchmark ?? (d as any).nifty50 ?? 0,
    })) as NAVDataPoint[];
    return { data, benchmarkName };
  },

  getCombinedDrawdown: async (params: { accountId: string; period?: string }) => {
    const res = await apiClient.get<{ period?: string; strategy?: { benchmark?: string }; series: { date: string; portfolio?: number; benchmark?: number | null }[] }>(ENDPOINTS.COMBINED_DRAWDOWN, { params });
    const series = res.data?.series ?? [];
    const benchmarkName = res.data?.strategy?.benchmark ?? 'Nifty 50';
    const data = series.map((d) => ({
      date: d.date,
      portfolioDD: d.portfolio ?? 0,
      benchmarkDD: d.benchmark ?? (d as any).nifty50 ?? 0,
    })) as DrawdownDataPoint[];
    return { data, benchmarkName };
  },

  getCombinedQuarterlyPL: async (params: { accountId: string }) => {
    const res = await apiClient.get<{ percentData: QuarterlyPL[]; rupeeData: QuarterlyPL[] }>(ENDPOINTS.COMBINED_QUARTERLY_PL, { params });
    return res.data;
  },

  getCombinedMonthlyPL: async (params: { accountId: string }) => {
    const res = await apiClient.get<{ percentData: MonthlyPL[]; rupeeData: MonthlyPL[] }>(ENDPOINTS.COMBINED_MONTHLY_PL, { params });
    return res.data;
  },

  getCombinedCashFlow: async (params: { accountId: string }) => {
    const res = await apiClient.get<{ transactions: CashFlowItem[]; total: number; formattedTotal: string }>(ENDPOINTS.COMBINED_CASHFLOW, { params });
    return res.data;
  },

  getSnapshot: async () => {
    const res = await apiClient.get<SnapshotData>(ENDPOINTS.SNAPSHOT);
    // Transform flat owners/accounts into legacy tree node structure
    const data = res.data;
    const root: SnapshotNode = {
      id: 'root',
      label: 'My Portfolio',
      type: 'owner',
      totalValue: data.totalPortfolioValue,
      ownerIds: data.owners.map((o) => o.id).filter(Boolean),
      groupId: data.groupId ?? null,
      isHeadOfFamily: data.isHeadOfFamily ?? false,
      children: data.owners.map((owner) => ({
        id: owner.id,
        label: owner.name,
        type: 'person' as const,
        totalValue: owner.totalValue,
        email: owner.email,
        children: owner.accounts.map((acc) => ({
          id: acc.id,
          label: acc.strategyName ?? acc.id,
          type: 'account' as const,
          totalValue: acc.portfolioValue,
          clientId: acc.clientId,
          mobile: acc.mobile,
          lastUpdated: acc.lastUpdated,
          status: acc.status,
          isClosed: acc.isClosed ?? acc.status === 'closed',
          accountType: acc.type,
          strategyPrefix: acc.strategyPrefix,
          strategyName: acc.strategyName,
          strategyColor: acc.strategyColor,
        })),
      })),
    };
    return root;
  },
};
