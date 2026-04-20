import { useQuery } from '@tanstack/react-query'
import { getCatalogEntry } from '../api/celestrakApi'
import { CACHE_TTL_MS } from '../../../storage/db'

export function satelliteOMMQueryKey(noradId: number) {
  return ['omm', noradId] as const
}

export function useSatelliteOMM(noradId: number) {
  return useQuery({
    queryKey: satelliteOMMQueryKey(noradId),
    queryFn: () => getCatalogEntry(noradId),
    staleTime: CACHE_TTL_MS,
    gcTime: CACHE_TTL_MS * 2,
    retry: 2,
  })
}
