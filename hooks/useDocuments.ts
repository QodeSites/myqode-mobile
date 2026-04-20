import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents';
import { useAuthStore } from '@/store/authStore';

export function useDocumentFiles(category: string | null) {
  const accountId = useAuthStore((s) => s.selectedAccountId);
  return useQuery({
    queryKey: ['documents', 'files', category, accountId],
    queryFn: () => documentsApi.getFiles(category!, accountId ?? undefined),
    enabled: !!category && !!accountId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
