import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '@/api/documents';
import { useAuthStore } from '@/store/authStore';

// Client documents live under each individual account (clientcode → clientid → S3).
// Owner/group aggregate scopes (numeric owner ids, GRP/OWN codes, group ids) have no
// documents of their own — the API resolves docs by clientcode, so an aggregate code
// 404s and the list comes back empty. Resolve those scopes to a real individual code.
function isIndividualCode(code: string | null | undefined): code is string {
  return !!code && !/^\d+$/.test(code) && !/^(GRP|OWN)/i.test(code);
}

export function useDocumentFiles(category: string | null) {
  // Pick whose documents to show: the selected account if it's an individual one,
  // else the logged-in user's own account, else the first individual account available.
  const accountId = useAuthStore((s) => {
    if (isIndividualCode(s.selectedAccountId)) return s.selectedAccountId;
    if (isIndividualCode(s.user?.clientCode)) return s.user!.clientCode;
    return s.user?.accountCodes?.find(isIndividualCode) ?? null;
  });
  return useQuery({
    queryKey: ['documents', 'files', category, accountId],
    queryFn: () => documentsApi.getFiles(category!, accountId ?? undefined),
    enabled: !!category && !!accountId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
