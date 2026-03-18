import { create } from 'zustand';
import { User, Account } from '@/api/auth';

export type StrategyKey = 'all' | 'QAW' | 'QTF' | 'QGF' | 'QFH';

const STRATEGY_PREFIXES: StrategyKey[] = ['QAW', 'QTF', 'QGF', 'QFH'];

export function strategyFromAccountId(accountId: string | null): StrategyKey {
  if (!accountId) return 'all';
  const prefix = accountId.slice(0, 3).toUpperCase();
  return (STRATEGY_PREFIXES as string[]).includes(prefix) ? (prefix as StrategyKey) : 'all';
}

function accountIdForStrategy(strategy: StrategyKey, accountCodes: string[]): string | null {
  if (strategy === 'all') return accountCodes[0] ?? null;
  return accountCodes.find((id) => id.toUpperCase().startsWith(strategy)) ?? accountCodes[0] ?? null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  selectedAccountId: string | null;
  selectedStrategy: StrategyKey;
  isHydrated: boolean;

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setSelectedAccount: (id: string) => void;
  setSelectedStrategy: (strategy: StrategyKey) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  selectedAccountId: null,
  selectedStrategy: 'all',
  isHydrated: false,

  setToken: (token) => set({ token }),
  setUser: (user) => {
    const accountId = user?.accountCodes?.[0] ?? null;
    console.log('[AUTH] setUser called, accountCodes:', user?.accountCodes, '→ selectedAccountId:', accountId);
    set({ user, selectedAccountId: accountId, selectedStrategy: strategyFromAccountId(accountId) });
  },
  setSelectedAccount: (id) => set({ selectedAccountId: id, selectedStrategy: strategyFromAccountId(id) }),
  setSelectedStrategy: (strategy) => {
    const accountCodes = get().user?.accountCodes ?? [];
    const accountId = accountIdForStrategy(strategy, accountCodes);
    set({ selectedStrategy: strategy, selectedAccountId: accountId });
  },
  setHydrated: (value) => set({ isHydrated: value }),
  logout: () =>
    set({
      token: null,
      user: null,
      selectedAccountId: null,
      selectedStrategy: 'all',
    }),
}));
