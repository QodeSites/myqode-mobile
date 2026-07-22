import { create } from 'zustand';
import { User } from '@/api/auth';
import * as SecureStore from 'expo-secure-store';
import { IMPERSONATION_TOKEN_KEY } from '@/api/client';

// Any key other than the reserved aggregate scopes is a live strategy prefix
// (e.g. 'QAW', 'QGF', or a future one like 'QLF') — kept as `string` so new
// strategies introduced by the backend work without a code change here.
export type StrategyKey = string;

// Strategy account codes follow `Q` + 2 letters (e.g. QAW, QTF, QGF, QLF...).
// Matching the pattern instead of an explicit whitelist means a new strategy
// launched on the backend is recognized automatically.
const STRATEGY_PREFIX_PATTERN = /^Q[A-Z]{2}/i;

export function strategyFromAccountId(accountId: string | null): StrategyKey {
  if (!accountId) return 'all';
  if (/^OWN/i.test(accountId)) return 'owner';
  if (/^GRP/i.test(accountId)) return 'family';
  const prefix = accountId.slice(0, 3).toUpperCase();
  if (STRATEGY_PREFIX_PATTERN.test(prefix)) return prefix;
  // Numeric owner IDs (e.g. '50602') — not a strategy prefix, not OWN/GRP
  if (/^\d/.test(accountId)) return 'owner';
  return 'all';
}

function defaultAccountId(accountCodes: string[]): string | null {
  if (!accountCodes.length) return null;

  const strategyCodes = accountCodes.filter((c) => STRATEGY_PREFIX_PATTERN.test(c));
  // Owner IDs are numeric strings added by the login route (ownerid from DB).
  // They are neither strategy prefixes nor GRP group codes.
  const ownerCodes = accountCodes.filter(
    (c) => !STRATEGY_PREFIX_PATTERN.test(c) && !/^GRP/i.test(c)
  );

  // Multiple strategy accounts → default to the owner aggregate so the user
  // lands on "All Strategies" rather than a single randomly-selected account.
  if (strategyCodes.length > 1 && ownerCodes.length > 0) {
    return ownerCodes[0];
  }

  // Single strategy account (or no owner code available) → select it directly.
  return strategyCodes[0] ?? accountCodes[0] ?? null;
}

function accountIdForStrategy(strategy: StrategyKey, accountCodes: string[]): string | null {
  if (strategy === 'owner') return accountCodes.find((c) => /^OWN/i.test(c)) ?? null;
  if (strategy === 'family') return accountCodes.find((c) => /^GRP/i.test(c)) ?? null;
  if (strategy === 'all') return defaultAccountId(accountCodes);
  // Only return an individual strategy account — never fall back to an OWN/GRP aggregate
  return accountCodes.find((id) => id.toUpperCase().startsWith(strategy.toUpperCase())) ?? null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  selectedAccountId: string | null;
  selectedAccountIds: string[] | null; // set when owner scope (Level 2) is active
  selectedStrategy: StrategyKey;
  isHydrated: boolean;
  isImpersonating: boolean;
  adminUser: User | null;

  // App-lock (biometric) state
  isLocked: boolean;        // true → LockScreen overlay covers the app
  biometricCapable: boolean; // device can authenticate (biometric or passcode)

  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setSelectedAccount: (id: string) => void;
  setScopeOwner: (ownerId: string, accountIds: string[]) => void;
  setSelectedStrategy: (strategy: StrategyKey) => void;
  setHydrated: (value: boolean) => void;
  setBiometricCapable: (value: boolean) => void;
  lock: () => void;
  unlock: () => void;
  logout: () => void;
  startImpersonation: (clientUser: User, impersonationToken: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  selectedAccountId: null,
  selectedAccountIds: null,
  selectedStrategy: 'all',
  isHydrated: false,
  isImpersonating: false,
  adminUser: null,
  isLocked: false,
  biometricCapable: false,

  setToken: (token) => set({ token }),
  setUser: (user) => {
    const accountId = defaultAccountId(user?.accountCodes ?? []);
    set({ user, selectedAccountId: accountId, selectedAccountIds: null, selectedStrategy: strategyFromAccountId(accountId) });
  },
  setSelectedAccount: (id) => set({ selectedAccountId: id, selectedAccountIds: null, selectedStrategy: strategyFromAccountId(id) }),
  // Use the pre-computed ownerId row in pms_master_sheet (same as web approach).
  // accountIds array is kept in the signature for backward compatibility but is no longer stored —
  // the API queries pre-computed rows via account_code = ownerId directly.
  setScopeOwner: (ownerId, _accountIds) => set({
    selectedAccountId: ownerId,
    selectedAccountIds: null,
    selectedStrategy: 'owner',
  }),
  setSelectedStrategy: (strategy) => {
    const accountCodes = get().user?.accountCodes ?? [];
    const accountId = accountIdForStrategy(strategy, accountCodes);
    set({ selectedStrategy: strategy, selectedAccountId: accountId, selectedAccountIds: null });
  },
  setHydrated: (value) => set({ isHydrated: value }),
  setBiometricCapable: (value) => set({ biometricCapable: value }),
  // Only lock when a session actually exists — locking the login screen makes no sense.
  // Disabled in development so Expo Go / dev builds don't hit the biometric prompt.
  lock: () => set((s) => (!__DEV__ && s.token ? { isLocked: true } : {})),
  unlock: () => set({ isLocked: false }),
  logout: () =>
    set({
      token: null,
      user: null,
      selectedAccountId: null,
      selectedAccountIds: null,
      selectedStrategy: 'all',
      isImpersonating: false,
      adminUser: null,
      isLocked: false,
    }),

  startImpersonation: async (clientUser, impersonationToken) => {
    await SecureStore.setItemAsync(IMPERSONATION_TOKEN_KEY, impersonationToken);
    const adminUser = get().user;
    const accountId = defaultAccountId(clientUser.accountCodes ?? []);
    set({
      adminUser,
      user: clientUser,
      isImpersonating: true,
      selectedAccountId: accountId,
      selectedAccountIds: null,
      selectedStrategy: strategyFromAccountId(accountId),
    });
  },

  stopImpersonation: async () => {
    await SecureStore.deleteItemAsync(IMPERSONATION_TOKEN_KEY);
    const adminUser = get().adminUser;

    // Guard: if adminUser is somehow null, fully log out rather than entering
    // a broken state where token exists but user is null.
    if (!adminUser) {
      set({
        token: null,
        user: null,
        adminUser: null,
        isImpersonating: false,
        selectedAccountId: null,
        selectedAccountIds: null,
        selectedStrategy: 'all',
      });
      return;
    }

    const accountId = defaultAccountId(adminUser.accountCodes ?? []);
    set({
      user: adminUser,
      adminUser: null,
      isImpersonating: false,
      selectedAccountId: accountId,
      selectedAccountIds: null,
      selectedStrategy: strategyFromAccountId(accountId),
    });
  },
}));
