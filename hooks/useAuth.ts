import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi, LoginPayload } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { router } from 'expo-router';

export function useLogin() {
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (data) => {
      console.log('[AUTH] login response:', JSON.stringify(data, null, 2));
      await authApi.storeToken(data.token);
      setToken(data.token);
      setUser(data.user);
      router.replace('/(tabs)/portfolio');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authApi.logout(),
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
      console.log('[AUTH] /me response:', JSON.stringify(user, null, 2));
      setUser(user);
      return user;
    },
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
