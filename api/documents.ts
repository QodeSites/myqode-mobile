import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface DocumentCategory {
  id: string;
  label: string;
  description?: string;
  fileCount: number;
}

export interface DocumentFile {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
  url: string;
  mimeType: string;
}

export const documentsApi = {
  getCategories: async (accountId?: string) => {
    const res = await apiClient.get<{ categories: DocumentCategory[] }>(ENDPOINTS.DOCUMENTS_LIST, { params: { accountId } });
    return res.data.categories ?? [];
  },

  getFiles: async (category: string, accountId?: string) => {
    const res = await apiClient.get<{ category: string; accountId: string; files: DocumentFile[] }>(`${ENDPOINTS.DOCUMENTS_FILES}/${category}`, { params: { accountId } });
    return res.data.files ?? [];
  },

  getDownloadUrl: async (key: string): Promise<string> => {
    const res = await apiClient.get<{ url: string }>(`${ENDPOINTS.DOCUMENTS_DOWNLOAD}/${encodeURIComponent(key)}`);
    return res.data.url;
  },
};
