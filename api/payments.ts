import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface CreateOrderPayload {
  accountId: string;
  amount: number;
  orderType: 'ONE_TIME' | 'NEW_STRATEGY';
  strategyType?: 'QAW' | 'QTF' | 'QGF';
  note?: string;
}

export interface CreateOrderResponse {
  orderId: string;
  cfOrderId?: string;
  paymentSessionId: string;
  orderAmount: number;
  amount?: number;
  currency?: string;
  status?: string;
  environment: string;
}

export interface TimelineStep {
  step: string;
  label: string;
  completedAt: string | null;
  done: boolean;
}

export interface SipChargeEntry {
  installmentNumber: number;
  amount: number;
  formattedAmount: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  cfPaymentId: string | null;
  paidAt: string | null;
  chargeDate: string | null;
  failureReason: string | null;
  retryCount: number;
}

export interface InvestmentOrder {
  orderId: string;
  amount: number;
  formattedAmount: string;
  currency: string;
  paymentType: 'ONE_TIME' | 'SIP';
  isNewStrategy: boolean;
  strategyType: string | null;
  paymentStatus: string;
  investmentStatus: string;
  statusLabel: string;
  statusMessage: string;
  statusColor: string;
  isTerminal: boolean;
  createdAt: string;
  updatedAt: string;
  paymentTime: string | null;
  settledAt: string | null;
  deployedAt: string | null;
  settlementAmount: number | null;
  transferUtr: string | null;
  bankReference: string | null;
  timeline: TimelineStep[];
  // SIP-specific fields (present when paymentType === 'SIP')
  frequency?: string;
  startDate?: string;
  endDate?: string | null;
  totalInstallments?: number | null;
  nextChargeDate?: string | null;
  cfSubscriptionId?: string | null;
  chargesCount?: number;
  successfulCharges?: number;
  failedCharges?: number;
  lastChargeTime?: string | null;
  chargeHistory?: SipChargeEntry[];
}

export interface InvestmentStatusResponse {
  accountId: string;
  active: InvestmentOrder[];
  completed: InvestmentOrder[];
  oneTime: { active: InvestmentOrder[]; completed: InvestmentOrder[] };
  sip: { active: InvestmentOrder[]; completed: InvestmentOrder[] };
  totalCount: number;
  lastUpdated: string;
}

export interface VerifySipResponse {
  subscriptionId: string;
  cfSubscriptionStatus: string;
  investmentStatus: string;
  isActive: boolean;
  isMandatePending: boolean;
  isFailed: boolean;
  amount: number;
  frequency: string;
  nextChargeDate: string | null;
  authorizationDetails: {
    authorizationStatus: string | null;
    authorizationTime: string | null;
  };
}

export interface VerifyOrderResponse {
  orderId: string;
  paymentStatus: string;
  isSuccess: boolean;
  payment: {
    amount: number;
    time: string;
    method: string;
  } | null;
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
    const res = await apiClient.get<VerifyOrderResponse>(ENDPOINTS.PAYMENTS_VERIFY, {
      params: { orderId },
    });
    return res.data;
  },

  verifySip: async (subscriptionId: string): Promise<VerifySipResponse> => {
    const res = await apiClient.get<VerifySipResponse>(ENDPOINTS.PAYMENTS_VERIFY_SIP, {
      params: { subscriptionId },
    });
    return res.data;
  },
};
