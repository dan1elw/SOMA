import { useQuery } from '@tanstack/react-query'
import { fetchAndCacheCatalog, loadCatalogFromCache } from '../api/celestrakApi'
import { isStale, CACHE_TTL_MS } from '../../../storage/db'

export const CATALOG_QUERY_KEY = ['catalog', 'active'] as const

async function catalogQueryFn() {
  const cached = await loadCatalogFromCache()
  if (cached && !isStale(cached.cachedAt)) return { data: cached.data, cachedAt: cached.cachedAt }
  const data = await fetchAndCacheCatalog()
  return { data, cachedAt: Date.now() }
}

export function useCatalog() {
  return useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: catalogQueryFn,
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS * 2,
    retry: 2,
  })
}
