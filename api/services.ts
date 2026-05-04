import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface Transaction {
  orderId: string;
  type: 'ONE_TIME' | 'SIP' | 'Lumpsum' | 'Withdrawal' | 'Switch';
  amount: number;
  currency: string;
  status: 'PAID' | 'EXPIRED' | 'PENDING' | 'PROCESSING' | 'ACTIVE' | 'CANCELLED' | 'PAUSED';
  date: string;
  frequency?: string;
  startDate?: string | null;
  // SIP-specific fields
  subscription_id?: string;
  nextChargeDate?: string | null;
}

export interface BankDetails {
  payableTo: string;
  accountNumber: string;
  bank: string;
  ifsc: string;
  micr?: string;
  copyText?: string;
}

export interface SwitchPayload {
  accountId: string;
  investedIn: string;
  switchTo: string;
  amount: number;
  reason: string;
  additionalNotes?: string;
}

export interface SetupSipPayload {
  accountId: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'weekly' | 'daily';
  startDate: string;
  endDate?: string;
  totalInstallments?: number;
}

export interface SetupSipResponse {
  subscriptionId: string;
  subscriptionSessionId: string;
  cfSubscriptionId: string;
  status: string;
  amount: number;
  frequency: string;
  startDate: string;
  firstChargeTime: string;
  expiryTime: string;
  environment: string;
}

export interface SipActionPayload {
  subscription_id: string;
  accountId: string;
  action: 'pause' | 'resume';
}

export interface SipActionResponse {
  success: boolean;
  message: string;
  data: {
    subscription_id: string;
    previous_status: string;
    new_status: string;
    amount: number;
    frequency: string;
  };
}

export interface CancelSipPayload {
  subscription_id: string;
  accountId: string;
}

export interface WithdrawalPayload {
  accountId: string;
  amount: number;
  additionalNotes?: string;
}

export interface StrategyInquiryPayload {
  accountId: string;
  question: string;
}

export interface DiscussionPayload {
  accountId: string;
  topic: string;
}

export interface PushTokenPayload {
  pushToken: string;
  platform?: 'ios' | 'android';
}

export const servicesApi = {
  getTransactions: async (accountId?: string) => {
    const res = await apiClient.get<{ transactions: Transaction[]; lastUpdated: string }>(ENDPOINTS.TRANSACTIONS, {
      params: { accountId },
    });
    return res.data;
  },

  switchStrategy: async (payload: SwitchPayload) => {
    const res = await apiClient.post<{ success: boolean; inquiry_id: string }>(ENDPOINTS.SWITCH_STRATEGY, payload);
    return res.data;
  },

  getBankDetails: async () => {
    const res = await apiClient.get<BankDetails>(ENDPOINTS.BANK_DETAILS);
    return res.data;
  },

  setupSip: async (payload: SetupSipPayload): Promise<SetupSipResponse> => {
    const res = await apiClient.post<SetupSipResponse>(ENDPOINTS.SETUP_SIP, payload);
    return res.data;
  },

  cancelSip: async (payload: CancelSipPayload): Promise<SipActionResponse> => {
    const res = await apiClient.post<SipActionResponse>(ENDPOINTS.CANCEL_SIP, payload);
    return res.data;
  },

  pauseResumeSip: async (payload: SipActionPayload): Promise<SipActionResponse> => {
    const res = await apiClient.post<SipActionResponse>(ENDPOINTS.PAUSE_RESUME_SIP, payload);
    return res.data;
  },

  withdrawal: async (payload: WithdrawalPayload): Promise<{ success: boolean; inquiry_id: string }> => {
    const res = await apiClient.post<{ success: boolean; inquiry_id: string }>(ENDPOINTS.WITHDRAWAL, payload);
    return res.data;
  },

  strategyInquiry: async (payload: StrategyInquiryPayload): Promise<{ success: boolean; inquiry_id: string }> => {
    const res = await apiClient.post<{ success: boolean; inquiry_id: string }>(ENDPOINTS.STRATEGY_INQUIRY, payload);
    return res.data;
  },

  discussion: async (payload: DiscussionPayload): Promise<{ success: boolean; inquiry_id: string }> => {
    const res = await apiClient.post<{ success: boolean; inquiry_id: string }>(ENDPOINTS.DISCUSSION, payload);
    return res.data;
  },

  registerPushToken: async (payload: PushTokenPayload): Promise<{ success: boolean }> => {
    const res = await apiClient.post<{ success: boolean }>(ENDPOINTS.REGISTER_PUSH_TOKEN, payload);
    return res.data;
  },

  deregisterPushToken: async (pushToken: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete<{ success: boolean }>(ENDPOINTS.REGISTER_PUSH_TOKEN, {
      data: { pushToken },
    });
    return res.data;
  },
};
