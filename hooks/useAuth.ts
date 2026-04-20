import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi, LoginPayload } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';
import {
  registerForPushNotifications,
  deregisterPushNotification,
  getCachedPushToken,
} from '@/utils/pushNotifications';

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (data) => {
      await Promise.all([
        authApi.storeToken(data.token),
        authApi.cacheUser(data.user),
      ]);
      setToken(data.token);
      setUser(data.user);
      router.replace('/(tabs)/portfolio');
      // Register push token after auth state is set (non-blocking)
      registerForPushNotifications().catch(() => {});
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: async () => {
      // Deregister push token before clearing the auth token so the DELETE
      // request still has a valid Bearer token to authenticate with.
      await deregisterPushNotification(getCachedPushToken());
      return authApi.logout();
    },
    onSettled: () => {
      logout();
      router.replace('/(auth)/login');
    },
  });
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      await authApi.cacheUser(user);
      return user;
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
