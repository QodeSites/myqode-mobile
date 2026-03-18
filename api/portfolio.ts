import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface PerformanceParams {
  accountId?: string;
  strategy?: string;
}

export interface PerformanceData {
  amountInvested: number;
  currentValue: number;
  totalReturns: number;
  returnsPercent: number;
  cagr: number;
  inceptionDate: string;
  dataAsOf: string;
  grossValue?: number;
  isNegative?: boolean;
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
  status: 'active' | 'inactive';
  mobile?: string;
}

export interface SnapshotOwner {
  id: string;
  name: string;
  email: string;
  totalValue: number;
  accounts: SnapshotAccount[];
}

export interface SnapshotData {
  owners: SnapshotOwner[];
  totalPortfolioValue: number;
  formattedTotal: string;
  activeAccountCount: number;
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
  status?: 'active' | 'inactive';
  accountType?: string;
}

export const portfolioApi = {
  getPerformance: async (params: PerformanceParams) => {
    const res = await apiClient.get<Omit<PerformanceData, 'trailingReturns'> & { trailingReturns: TrailingReturnsRaw }>(ENDPOINTS.PERFORMANCE, { params });
    const raw = res.data;
    const benchmarkName = (raw as any).strategy?.benchmark ?? 'Benchmark';
    const trailingReturns: TrailingReturn[] = Object.entries(raw.trailingReturns ?? {}).map(
      ([key, values]) => ({
        name: key === 'portfolio' ? 'Portfolio' : key === 'nifty50' ? 'Nifty 50' : key === 'benchmark' ? benchmarkName : key,
        type: key === 'portfolio' ? 'portfolio' : 'benchmark',
        ...values,
      })
    );
    return { ...raw, trailingReturns };
  },

  getNAV: async (params: PerformanceParams & { period?: string }) => {
    const res = await apiClient.get<{ period?: string; strategy?: { benchmark?: string }; series: { date: string; portfolio?: number; benchmark?: number; nifty50?: number }[] }>(ENDPOINTS.NAV, { params });
    const series = res.data?.series ?? [];
    const benchmarkName = res.data?.strategy?.benchmark ?? 'Benchmark';
    const data = series.map((d) => ({
      date: d.date,
      portfolioNav: d.portfolio ?? 0,
      benchmarkNav: d.benchmark ?? d.nifty50 ?? 0,
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
      benchmarkDD: d.benchmark ?? d.nifty50 ?? 0,
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

  getSnapshot: async () => {
    const res = await apiClient.get<SnapshotData>(ENDPOINTS.SNAPSHOT);
    // Transform flat owners/accounts into legacy tree node structure
    const data = res.data;
    const root: SnapshotNode = {
      id: 'root',
      label: 'My Portfolio',
      type: 'owner',
      totalValue: data.totalPortfolioValue,
      children: data.owners.map((owner) => ({
        id: owner.id,
        label: owner.name,
        type: 'person' as const,
        totalValue: owner.totalValue,
        email: owner.email,
        children: owner.accounts.map((acc) => ({
          id: acc.id,
          label: acc.id,
          type: 'account' as const,
          totalValue: acc.portfolioValue,
          clientId: acc.clientId,
          mobile: acc.mobile,
          lastUpdated: acc.lastUpdated,
          status: acc.status,
          accountType: acc.type,
        })),
      })),
    };
    return root;
  },
};
