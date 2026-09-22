import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface PrimaryUccEntry {
  uccCode: string;
  strategy: string | null;
  groupName: string | null;
}

interface PrimaryUccResponse {
  success: boolean;
  primaries: PrimaryUccEntry[];
}

export const primaryUccApi = {
  // Groups are derived server-side from the Bearer token, so no identifiers
  // are sent — an investor cannot request another family's primary code.
  async get(): Promise<PrimaryUccEntry[]> {
    const { data } = await apiClient.get<PrimaryUccResponse>(ENDPOINTS.PRIMARY_UCC);
    return data?.success && Array.isArray(data.primaries) ? data.primaries : [];
  },
};
