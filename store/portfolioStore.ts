import { create } from 'zustand';

export type PeriodFilter = '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y' | 'ALL';
export type PLToggle = 'percent' | 'rupees';

interface PortfolioState {
  selectedPeriod: PeriodFilter;
  plToggle: PLToggle;
  lastRefreshed: Date | null;

  setSelectedPeriod: (period: PeriodFilter) => void;
  setPLToggle: (toggle: PLToggle) => void;
  setLastRefreshed: (date: Date) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  selectedPeriod: '1Y',
  plToggle: 'percent',
  lastRefreshed: null,

  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  setPLToggle: (toggle) => set({ plToggle: toggle }),
  setLastRefreshed: (date) => set({ lastRefreshed: date }),
}));
