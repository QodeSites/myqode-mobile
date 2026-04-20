import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface FamilyAccount {
  clientid: string;
  clientcode: string;
  holderName: string;
  relation: 'Primary' | 'Family Member' | string;
  status: 'Active' | 'Pending KYC' | 'Dormant' | string;
  head_of_family: boolean;
  groupid: string;
  groupname: string;
  groupemailid: string;
  ownerid: string;
  ownername: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pannumber: string;
}

export interface FamilyOwner {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  accountCount: number;
  accounts: FamilyAccount[];
}

export interface FamilyGroup {
  groupName: string;
  groupId: string;
  groupEmail: string;
  totalAccounts: number;
  owners: FamilyOwner[];
}

export interface FamilyResponse {
  isHeadOfFamily: boolean;
  groupId: string;
  groupName: string;
  tree: FamilyGroup[];
  flatMembers: FamilyAccount[];
  totalMembers: number;
}

export interface AccountRequestPayload {
  accountId: string;
  message: string;
}

export const familyApi = {
  getFamily: async (): Promise<FamilyResponse> => {
    const res = await apiClient.get<FamilyResponse>(ENDPOINTS.FAMILY);
    return res.data;
  },

  submitAccountRequest: async (payload: AccountRequestPayload) => {
    const res = await apiClient.post<{ success: boolean; inquiry_id: string }>(
      ENDPOINTS.ACCOUNT_REQUEST,
      payload
    );
    return res.data;
  },
};
