import { useEffect, useRef, useState } from 'react';
import { View, AppState, AppStateStatus, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { IMPERSONATION_TOKEN_KEY } from '@/api/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { paymentsApi } from '@/api/payments';
import { ImpersonationBanner } from '@/components/ui/ImpersonationBanner';
import { ForceUpdateModal } from '@/components/ui/ForceUpdateModal';
import { registerCashfreeCallback, getPendingSipId, setPendingSipId } from '@/hooks/useCashfreePayment';
import { Analytics } from '@/utils/analytics';
import { API_BASE_URL, ENDPOINTS } from '@/constants/Api';
import { registerForPushNotifications } from '@/utils/pushNotifications';
import Constants from 'expo-constants';
import '../global.css';

// ── Semver comparison ────────────────────────────────────────────────────────
// Returns true if `a` is strictly less than `b` (both "x.y.z" strings).
function semverLt(a: string, b: string): boolean {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);
  if (aMaj !== bMaj) return aMaj < bMaj;
  if (aMin !== bMin) return aMin < bMin;
  return aPat < bPat;
}

interface AppVersionInfo {
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  message: string;
  updateUrls: { ios: string; android: string };
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10 * 60 * 1000,   // data stays fresh for 10 min
      gcTime: 30 * 60 * 1000,       // keep unused cache for 30 min
      refetchOnWindowFocus: false,   // don't refetch on tab switch / app foreground
      refetchOnReconnect: true,      // refresh stale financial data after network reconnect
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
  });

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isImpersonating = useAuthStore((s) => s.isImpersonating);
  const user = useAuthStore((s) => s.user);

  // ── Force-update state ────────────────────────────────────────────────────
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        // Always clear any stale impersonation token on app start —
        // impersonation state is in-memory only and cannot be restored across restarts
        await SecureStore.deleteItemAsync(IMPERSONATION_TOKEN_KEY);

        // Load token and cached user in parallel — no network request yet
        const [token, cachedUser] = await Promise.all([
          authApi.getToken(),
          authApi.getCachedUser(),
        ]);

        if (!token) return; // not logged in

        setToken(token);

        // Restore cached user immediately so strategies/name appear instantly
        if (cachedUser) {
          setUser(cachedUser);
        }

        // Refresh from API in background
        try {
          const freshUser = await authApi.me();
          setUser(freshUser);
          await authApi.cacheUser(freshUser);

          // Initialise analytics with the real token so queued events can flush
          Analytics.init(`${API_BASE_URL}/mobile`, token);
          Analytics.identify(freshUser.clientId);

          // Register push token in background — non-blocking, never throws
          registerForPushNotifications().catch(() => {});
        } catch (err: any) {
          if (err?.response?.status === 401) {
            // Token expired — force re-login
            await authApi.clearToken();
            logout();
          }
          // Network/server error: cached user already set, keep it
        }
      } catch {
        // no-op
      } finally {
        setHydrated(true);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isHydrated]);

  // ── Version check — runs once on mount, non-blocking ─────────────────────
  useEffect(() => {
    async function checkAppVersion() {
      try {
        const res = await fetch(`${API_BASE_URL}${ENDPOINTS.APP_VERSION}`);
        if (!res.ok) return; // silently ignore server errors

        const data: AppVersionInfo = await res.json();
        const installedVersion = Constants.expoConfig?.version ?? '0.0.0';

        const needsForceUpdate = data.forceUpdate || semverLt(installedVersion, data.minVersion);
        const needsSoftUpdate  = !needsForceUpdate && semverLt(installedVersion, data.latestVersion);

        if (needsForceUpdate || needsSoftUpdate) {
          setUpdateInfo(data);
          setIsForceUpdate(needsForceUpdate);
          setUpdateModalVisible(true);
        }
      } catch {
        // Network error or parse failure — never block the user
      }
    }
    checkAppVersion();
  }, []);

  // Register global Cashfree SDK callback once on mount.
  // The same callback fires for both one-time payments AND SIP mandate authorisations.
  // We distinguish them via getPendingSipId() — set by launchSipMandate before the SDK opens.
  useEffect(() => {
    registerCashfreeCallback(
      async (callbackId) => {
        const pendingSipId = getPendingSipId();
        const isSip = !!pendingSipId && pendingSipId === callbackId;

        if (isSip) {
          // ── SIP mandate completed ──────────────────────────────────────────
          setPendingSipId(null);
          try {
            await paymentsApi.verifySip(callbackId);
          } catch {
            // verify-sip failed — the webhook will eventually sync the status.
          }
          queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
          queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
          // Navigate to SIP Management so the user can see the new SIP status.
          router.replace('/(tabs)/invest/sip-management' as any);
        } else {
          // ── One-time / new-strategy payment completed ──────────────────────
          try {
            await paymentsApi.verifyOrder(callbackId);
          } catch {
            // Verify failed — payment may still have succeeded; user can pull-to-refresh.
          }
          queryClient.invalidateQueries({ queryKey: ['payments', 'investment-status'] });
          queryClient.invalidateQueries({ queryKey: ['services', 'transactions'] });
          // Navigate to Orders so the user can see the new order status.
          router.replace('/(tabs)/invest' as any);
        }
      },
      (_error, callbackId) => {
        const pendingSipId = getPendingSipId();
        const isSip = !!pendingSipId && pendingSipId === callbackId;
        if (isSip) setPendingSipId(null);

        Alert.alert(
          isSip ? 'SIP Setup Not Completed' : 'Payment Not Completed',
          isSip
            ? `The mandate authorisation was not completed. You can retry from the SIPs screen.`
            : `Your payment for order ${callbackId} was not completed. You can retry from the Invest screen.`,
          [{ text: 'OK' }],
        );
        // Navigate away so the add-funds screen unmounts and isProcessing resets,
        // allowing the user to retry without getting stuck on a disabled button.
        if (isSip) {
          router.replace('/(tabs)/invest/sip-management' as any);
        } else {
          router.replace('/(tabs)/invest' as any);
        }
      },
    );
  }, []);

  // Route super admin to admin screen on first login only
  const hasRedirectedAdmin = useRef(false);
  useEffect(() => {
    if (!isHydrated || (!fontsLoaded && !fontError)) return;
    if (user?.isSuperAdmin && !isImpersonating && !hasRedirectedAdmin.current) {
      hasRedirectedAdmin.current = true;
      router.replace('/(admin)');
    }
  }, [user?.isSuperAdmin, isImpersonating, isHydrated, fontsLoaded, fontError]);

  // Security: clear impersonation token when app goes to background.
  // Prevents a scenario where a super-admin hands their device to someone
  // who then continues viewing the impersonated client's data.
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Flush any pending analytics events before going to background
        Analytics.flush();

        // Security: clear impersonation so device hand-off is safe
        try {
          const impToken = await SecureStore.getItemAsync(IMPERSONATION_TOKEN_KEY);
          if (impToken) {
            await SecureStore.deleteItemAsync(IMPERSONATION_TOKEN_KEY);
            // Stop impersonation in-store so UI reflects the change on foreground
            const { useAuthStore: store } = await import('@/store/authStore');
            store.getState().stopImpersonation();
          }
        } catch {
          // SecureStore unavailable — ignore
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Keep splash visible until both fonts and auth are ready
  // Use a solid dark-green background instead of null so the screen is never white
  if ((!fontsLoaded && !fontError) || !isHydrated) {
    return <View style={{ flex: 1, backgroundColor: '#1A3D2B' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <View style={{ flex: 1 }}>
            <ImpersonationBanner />
            {/* Zero out top inset for screens below the banner so they don't double-pad */}
            <SafeAreaInsetsContext.Consumer>
              {(insets) => (
                <SafeAreaInsetsContext.Provider
                  value={isImpersonating ? { ...insets!, top: 0 } : insets!}
                >
                  <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1 } }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(admin)" />
                  </Stack>
                </SafeAreaInsetsContext.Provider>
              )}
            </SafeAreaInsetsContext.Consumer>
          </View>
          <StatusBar style="auto" />

          {/* Force-update / soft-update modal — rendered outside the Stack so it
              overlays everything including modals opened by individual screens.   */}
          {updateInfo && (
            <ForceUpdateModal
              visible={updateModalVisible}
              forceUpdate={isForceUpdate}
              latestVersion={updateInfo.latestVersion}
              message={updateInfo.message}
              updateUrls={updateInfo.updateUrls}
              onDismiss={isForceUpdate ? undefined : () => setUpdateModalVisible(false)}
            />
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
