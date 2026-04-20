import apiClient from './client';
import { ENDPOINTS, API_BASE_URL } from '@/constants/Api';

// /send-email lives at /api/send-email, not under /api/mobile
const SEND_EMAIL_URL = API_BASE_URL.replace(/\/mobile$/, '') + '/send-email';

export interface NewsletterItem {
  key: string;
  title: string;      // e.g. "Jan-2026"
  filename: string;
  section: string;
  url: string;
  type: string;
  size: number;
  lastModified: string;
}

interface NewsletterListResponse {
  items: NewsletterItem[];
  count: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  registrationUrl?: string;
}

export interface PortalGuideFile {
  key: string;
  filename: string;
  reportName: string;
  url: string;
  size: number;
}

export interface PortalGuideResponse {
  videos: PortalGuideFile[];
  snapshots: PortalGuideFile[];
  byReport: {
    snapshots: Record<string, PortalGuideFile[]>;
    videos: Record<string, PortalGuideFile[]>;
  };
  counts: {
    videos: number;
    snapshots: number;
  };
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
    const res = await apiClient.get<NewsletterListResponse>(ENDPOINTS.NEWSLETTERS);
    return res.data.items ?? [];
  },

  getPerspectives: async () => {
    const res = await apiClient.get<NewsletterListResponse>(ENDPOINTS.PERSPECTIVES);
    return res.data.items ?? [];
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

  sendEmail: async (payload: Record<string, unknown>): Promise<{ success: boolean; inquiry_id: string }> => {
    const res = await apiClient.post(SEND_EMAIL_URL, payload);
    return res.data;
  },

  getPortalGuide: async (): Promise<PortalGuideResponse> => {
    const res = await apiClient.get<PortalGuideResponse>(ENDPOINTS.PORTAL_GUIDE);
    return res.data;
  },
};
