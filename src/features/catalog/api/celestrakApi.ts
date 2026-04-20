import { db, isStale, type CachedOMM } from '../../../storage/db'
import type { OMM } from '../../../types/omm'

const BASE = 'https://celestrak.org/NORAD/elements/gp.php'

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`CelesTrak fetch failed: ${res.status}`)
  return res.json() as Promise<T>
}

export async function fetchAndCacheCatalog(): Promise<OMM[]> {
  const data = await fetchJson<OMM[]>(`${BASE}?GROUP=active&FORMAT=json`)
  const now = Date.now()
  const records: CachedOMM[] = data.map((omm) => ({ ...omm, cachedAt: now }))
  await db.transaction('rw', [db.omm, db.catalogMeta], async () => {
    await db.omm.bulkPut(records)
    await db.catalogMeta.put({ id: 'active', cachedAt: now, count: data.length })
  })
  return data
}

export async function loadCatalogFromCache(): Promise<{ data: OMM[]; cachedAt: number } | null> {
  const meta = await db.catalogMeta.get('active')
  if (!meta) return null
  const records = await db.omm.toArray()
  return { data: records, cachedAt: meta.cachedAt }
}

export async function fetchAndCacheOMM(noradId: number): Promise<OMM> {
  const data = await fetchJson<OMM[]>(`${BASE}?CATNR=${noradId}&FORMAT=json`)
  const omm = data[0]
  if (!omm) throw new Error(`No OMM returned for NORAD ID ${noradId}`)
  await db.omm.put({ ...omm, cachedAt: Date.now() })
  return omm
}

export async function loadOMMFromCache(noradId: number): Promise<CachedOMM | null> {
  return (await db.omm.get(noradId)) ?? null
}

export async function getCatalogEntry(noradId: number): Promise<OMM> {
  const cached = await loadOMMFromCache(noradId)
  if (cached && !isStale(cached.cachedAt)) return cached
  return fetchAndCacheOMM(noradId)
}
