import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface NewsletterItem {
  id: string;
  title: string;
  monthYear: string;
  pdfUrl: string;
  thumbnail?: string;
  subtitle?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  registrationUrl?: string;
}

export interface ReferralPayload {
  refereeName: string;
  refereePhone: string;
  refereeEmail: string;
  relationship: string;
}

export interface FeedbackPayload {
  rating: number;
  message: string;
  category?: string;
}

export const engagementApi = {
  getNewsletters: async () => {
    const res = await apiClient.get<NewsletterItem[]>(ENDPOINTS.NEWSLETTERS);
    return res.data;
  },

  getPerspectives: async () => {
    const res = await apiClient.get<NewsletterItem[]>(ENDPOINTS.PERSPECTIVES);
    return res.data;
  },

  submitReferral: async (payload: ReferralPayload) => {
    const res = await apiClient.post(ENDPOINTS.REFERRAL, payload);
    return res.data;
  },

  submitFeedback: async (payload: FeedbackPayload) => {
    const res = await apiClient.post(ENDPOINTS.FEEDBACK, payload);
    return res.data;
  },

  getEvents: async () => {
    const res = await apiClient.get<Event[]>(ENDPOINTS.EVENTS);
    return res.data;
  },
};
