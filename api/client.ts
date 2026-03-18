import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants/Api';
import { router } from 'expo-router';

export const TOKEN_KEY = 'myqode_auth_token';

console.log('[API] Base URL:', API_BASE_URL);

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // silently fail — request proceeds without token
    }
    console.log('[REQ]', config.method?.toUpperCase(), config.url, config.params ?? '');
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (_) {}
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
