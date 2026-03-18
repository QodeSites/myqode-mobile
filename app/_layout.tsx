import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10 * 60 * 1000,   // data stays fresh for 10 min
      gcTime: 30 * 60 * 1000,       // keep unused cache for 30 min
      refetchOnWindowFocus: false,   // don't refetch on tab switch / app foreground
      refetchOnReconnect: false,     // don't refetch on network reconnect
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_700Bold,
  });

  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await authApi.getToken();
        if (token) {
          setToken(token);
          try {
            const user = await authApi.me();
            setUser(user);
          } catch (err: any) {
            // Only clear token on 401 (invalid/expired) — not on network errors
            if (err?.response?.status === 401) {
              await authApi.clearToken();
            } else {
              // Network error or server down — keep token so user stays logged in
              // App will show stale data or retry on next API call
            }
          }
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
    if (fontsLoaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isHydrated]);

  // Keep splash visible until both fonts and auth are ready
  if (!fontsLoaded || !isHydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
