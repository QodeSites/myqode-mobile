import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  type: 'fund_manager' | 'ir' | 'support';
  email?: string;
  phone?: string;
  whenToContact?: string;
  calendlyUrl?: string;
  whatsappNumber?: string;
}

export interface Strategy {
  // Widened from a closed union so a new strategy code returned by the API
  // (e.g. 'QLF') doesn't need a type update here to type-check.
  id: string;
  name: string;
  fullName: string;
  description: string;
  tags: string[];
  colorKey: string;
  longDescription?: string;
  philosophy?: string;
  metrics?: {
    cagr?: number;
    maxDD?: number;
    sharpe?: number;
  };
}

export const aboutApi = {
  getTeam: async () => {
    const res = await apiClient.get<TeamMember[]>(ENDPOINTS.TEAM);
    return res.data;
  },

  getStrategies: async () => {
    const res = await apiClient.get<Strategy[]>(ENDPOINTS.STRATEGIES);
    return res.data;
  },
};
