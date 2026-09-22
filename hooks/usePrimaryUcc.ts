import { useQuery } from '@tanstack/react-query';
import { primaryUccApi } from '@/api/primaryUcc';
import { useAuthStore } from '@/store/authStore';

// On Nuvama's WealthSpectrum portal every UCC is a valid login, but only the
// primary one shows all of a group's mapped schemes in a single view — any
// other code shows just that scheme. This resolves which code that is.
//
// The code changes only when accounts are added or signed off, so it is cached
// for an hour; a stale value here is harmless, and the notice is advisory.
export function usePrimaryUcc() {
  const isAuthenticated = useAuthStore((s) => !!s.user);

  const { data } = useQuery({
    queryKey: ['primary-ucc'],
    queryFn: () => primaryUccApi.get(),
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    // Advisory only — never surface a failure, just show nothing.
    retry: 1,
  });

  const primaries = data ?? [];
  const codes = new Set(primaries.map((p) => (p.uccCode || '').trim().toUpperCase()));

  return {
    primaries,
    /** True when this account code is the primary UCC for its family. */
    isPrimaryUcc: (clientcode?: string | null) =>
      !!clientcode && codes.has(clientcode.trim().toUpperCase()),
  };
}
