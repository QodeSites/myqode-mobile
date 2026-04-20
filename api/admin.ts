import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';
import { User } from './auth';

export interface AdminClientAccount {
  clientId: string;
  clientCode: string;
  name: string;
  onboardingStatus?: string;
  isHeadOfFamily: boolean;
  loginCount?: number;
  lastLogin?: string;
}

export interface AdminClient {
  ownerId: string;
  ownerName: string;
  email: string;
  mobile?: string;
  groupId?: string;
  groupName?: string;
  headClientCode: string;
  headClientId: string;
  isHeadOfFamily?: boolean;
  accountCodes: string[];
  totalAccounts?: number;
  onboardingStatus?: string;
  loginCount?: number;
  lastLogin?: string;
  accounts?: AdminClientAccount[];
}

export interface AdminClientsResponse {
  clients: AdminClient[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImpersonateResponse {
  token: string;
  expiresIn: number;
  user: User;
}

export interface AdminClientsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const adminApi = {
  getClients: async (params?: AdminClientsParams): Promise<AdminClientsResponse> => {
    const res = await apiClient.get<AdminClientsResponse>(ENDPOINTS.ADMIN_CLIENTS, { params });
    return res.data;
  },

  impersonate: async (clientCode: string): Promise<ImpersonateResponse> => {
    const res = await apiClient.post<ImpersonateResponse>(ENDPOINTS.ADMIN_IMPERSONATE, { clientCode });
    return res.data;
  },
};
