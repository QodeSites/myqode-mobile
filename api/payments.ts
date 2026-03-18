import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface CreateOrderPayload {
  accountId: string;
  amount: number;
  note?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  cfOrderId: string;
  paymentSessionId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface TimelineStep {
  step: number;
  label: string;
  status: 'completed' | 'active' | 'pending';
  date?: string;
  note?: string;
}

export interface InvestmentOrder {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineStep[];
  accountId: string;
  note?: string;
}

export interface InvestmentStatusResponse {
  orders: InvestmentOrder[];
}

export interface VerifyOrderResponse {
  orderId: string;
  status: string;
  message: string;
}

export const paymentsApi = {
  createOrder: async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    const res = await apiClient.post<CreateOrderResponse>(ENDPOINTS.PAYMENTS_CREATE_ORDER, payload);
    return res.data;
  },

  getInvestmentStatus: async (accountId?: string): Promise<InvestmentStatusResponse> => {
    const res = await apiClient.get<InvestmentStatusResponse>(ENDPOINTS.PAYMENTS_INVESTMENT_STATUS, {
      params: accountId ? { accountId } : undefined,
    });
    return res.data;
  },

  verifyOrder: async (orderId: string): Promise<VerifyOrderResponse> => {
    const res = await apiClient.post<VerifyOrderResponse>(ENDPOINTS.PAYMENTS_VERIFY, { orderId });
    return res.data;
  },
};
