import apiClient, { TOKEN_KEY, IMPERSONATION_TOKEN_KEY } from './client';
import { ENDPOINTS } from '@/constants/Api';
import * as SecureStore from 'expo-secure-store';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  clientId: string;
  clientCode: string;
  name: string;
  email: string;
  accountCodes: string[];
  isHeadOfFamily: boolean;
  avatar?: string;
  isSuperAdmin?: boolean;
  isImpersonated?: boolean;
  impersonatedBy?: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
}

const USER_CACHE_KEY = 'myqode_user_cache';

export const authApi = {
  checkIdentifier: async (identifier: string): Promise<{ exists: boolean }> => {
    const res = await apiClient.post<{ exists: boolean }>(ENDPOINTS.CHECK_IDENTIFIER, { identifier }, { timeout: 5000 });
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      ENDPOINTS.FORGOT_PASSWORD,
      { email: email.trim().toLowerCase() },
      { timeout: 10_000 }
    );
    return res.data;
  },

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>(ENDPOINTS.LOGIN, payload);
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(IMPERSONATION_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_CACHE_KEY),
      ]);
    }
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<User>(ENDPOINTS.ME);
    return res.data;
  },

  storeToken: async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  getToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  clearToken: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(IMPERSONATION_TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_CACHE_KEY),
    ]);
  },

  // Cache user object so app restores immediately on reopen
  cacheUser: async (user: User): Promise<void> => {
    await SecureStore.setItemAsync(USER_CACHE_KEY, JSON.stringify(user));
  },

  getCachedUser: async (): Promise<User | null> => {
    try {
      const raw = await SecureStore.getItemAsync(USER_CACHE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },
};
