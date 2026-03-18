import apiClient, { TOKEN_KEY } from './client';
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
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  user: User;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>(ENDPOINTS.LOGIN, payload);
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
    } finally {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
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
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
