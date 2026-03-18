import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface Transaction {
  orderId: string;
  type: 'ONE_TIME' | 'SIP' | 'Lumpsum' | 'Withdrawal' | 'Switch';
  amount: number;
  currency: string;
  status: 'PAID' | 'EXPIRED' | 'PENDING' | 'PROCESSING';
  date: string;
  frequency?: string;
  startDate?: string | null;
}

export interface BankDetails {
  payableTo: string;
  accountNumber: string;
  bank: string;
  ifsc: string;
  micr?: string;
  copyText?: string;
}

export interface AddFundsPayload {
  accountId: string;
  amount: number;
  type: 'SIP' | 'Lumpsum';
  frequency?: 'Monthly' | 'Quarterly';
  startDate?: string;
}

export interface SwitchPayload {
  fromStrategy: string;
  toStrategy: string;
  amount?: number;
  percentage?: number;
  remarks?: string;
}

export const servicesApi = {
  getTransactions: async (accountId?: string) => {
    const res = await apiClient.get<{ transactions: Transaction[]; lastUpdated: string }>(ENDPOINTS.TRANSACTIONS, {
      params: { accountId },
    });
    return res.data.transactions ?? [];
  },

  addFunds: async (payload: AddFundsPayload) => {
    const res = await apiClient.post(ENDPOINTS.ADD_FUNDS, payload);
    return res.data;
  },

  switchStrategy: async (payload: SwitchPayload) => {
    const res = await apiClient.post(ENDPOINTS.SWITCH_STRATEGY, payload);
    return res.data;
  },

  getBankDetails: async () => {
    const res = await apiClient.get<BankDetails>(ENDPOINTS.BANK_DETAILS);
    return res.data;
  },
};
