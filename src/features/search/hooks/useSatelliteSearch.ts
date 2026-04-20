import { useMemo } from 'react'
import { useCatalog } from '../../catalog/hooks/useCatalog'
import { fuzzyMatch } from '../utils/fuzzyMatch'
import { detectQueryType } from '../utils/detectQueryType'
import type { CatalogEntry } from '../../../types/satellite'

const MAX_RESULTS = 10

export function useSatelliteSearch(query: string): CatalogEntry[] {
  const { data: catalogResult } = useCatalog()

  return useMemo(() => {
    const q = query.trim()
    if (q.length < 2 || !catalogResult) return []

    const omms = catalogResult.data
    const type = detectQueryType(q)

    if (type === 'norad-id') {
      return omms
        .filter((omm) => String(omm.NORAD_CAT_ID).startsWith(q))
        .slice(0, MAX_RESULTS)
        .map((omm) => ({
          noradId: omm.NORAD_CAT_ID,
          name: omm.OBJECT_NAME,
          objectId: omm.OBJECT_ID,
        }))
    }

    return omms
      .map((omm) => ({
        entry: {
          noradId: omm.NORAD_CAT_ID,
          name: omm.OBJECT_NAME,
          objectId: omm.OBJECT_ID,
        },
        score: fuzzyMatch(q, omm.OBJECT_NAME),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((r) => r.entry)
  }, [query, catalogResult])
}
