import apiClient from './client';
import { ENDPOINTS } from '@/constants/Api';

export interface DocumentFile {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
  url: string;
  mimeType: string;
}

export interface CategoryFilesResponse {
  category: string;
  accountId: string;
  clientId: string;
  prefix: string;
  files: DocumentFile[];
}

// Static category list — the API has no list endpoint
export interface DocumentCategory {
  id: string;
  name: string;
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  { id: 'pms-agreement',   name: 'PMS Agreement' },
  { id: 'account-opening', name: 'Account Opening Documents' },
  { id: 'cml',             name: 'CML' },
  { id: 'disclosures',     name: 'Disclosures' },
];

export const documentsApi = {
  getFiles: async (category: string, accountId?: string): Promise<DocumentFile[]> => {
    const res = await apiClient.get<CategoryFilesResponse>(
      `${ENDPOINTS.DOCUMENTS_FILES}/${category}`,
      { params: accountId ? { accountId } : undefined }
    );
    return res.data.files ?? [];
  },

  getDownloadUrl: async (key: string): Promise<string> => {
    const res = await apiClient.get<{ url: string }>(
      `${ENDPOINTS.DOCUMENTS_DOWNLOAD}/${encodeURIComponent(key)}`
    );
    return res.data.url;
  },
};
