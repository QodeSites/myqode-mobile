import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/Api';
import { router } from 'expo-router';

export const TOKEN_KEY = 'myqode_auth_token';
export const IMPERSONATION_TOKEN_KEY = 'myqode_impersonation_token';

// Log only in development — never in production builds
if (__DEV__) {
  console.log('[API] Base URL:', API_BASE_URL);
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000, // 30s — chart endpoints can be slow on large data sets
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach Bearer token ────────────────────────────────
// Impersonation token takes priority over the regular token.
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const impersonationToken = await SecureStore.getItemAsync(IMPERSONATION_TOKEN_KEY);
      const token = impersonationToken ?? await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore unavailable — request proceeds without token (will get 401)
    }
    if (__DEV__) {
      console.log('[REQ]', config.method?.toUpperCase(), config.url, config.params ?? '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 + retry on network errors ──────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    const status = error?.response?.status;

    // Auto-retry on network errors and 5xx (not 4xx — those are client errors)
    const isNetworkError = !error.response;
    const isServerError  = status && status >= 500;
    const retryCount     = config?._retryCount ?? 0;

    if ((isNetworkError || isServerError) && retryCount < 2 && config) {
      config._retryCount = retryCount + 1;
      const delay = 1000 * Math.pow(2, retryCount); // 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(config);
    }

    // Handle 401 — token expired or invalid
    if (status === 401) {
      try {
        const impToken = await SecureStore.getItemAsync(IMPERSONATION_TOKEN_KEY);
        if (impToken) {
          // Impersonation token expired — exit impersonation, return to admin screen
          await SecureStore.deleteItemAsync(IMPERSONATION_TOKEN_KEY);
          const { useAuthStore } = await import('@/store/authStore');
          useAuthStore.getState().stopImpersonation();
          router.replace('/(admin)');
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          const { useAuthStore } = await import('@/store/authStore');
          useAuthStore.getState().logout();
          router.replace('/(auth)/login');
        }
      } catch {
        router.replace('/(auth)/login');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
