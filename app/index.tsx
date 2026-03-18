import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function RootIndex() {
  const token = useAuthStore((s) => s.token);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Wait until the auth state is hydrated from SecureStore
  if (!isHydrated) return null;

  if (token) {
    return <Redirect href="/(tabs)/portfolio" />;
  }

  return <Redirect href="/(auth)/login" />;
}
