import Dexie, { type Table } from 'dexie'
import type { OMM } from '../types/omm'

export interface CachedOMM extends OMM {
  cachedAt: number
}

export interface CatalogMeta {
  id: 'active'
  cachedAt: number
  count: number
}

class SomaDatabase extends Dexie {
  omm!: Table<CachedOMM, number>
  catalogMeta!: Table<CatalogMeta, string>

  constructor() {
    super('soma')
    this.version(1).stores({
      omm: 'NORAD_CAT_ID, cachedAt',
      catalogMeta: 'id',
    })
  }
}

export const db = new SomaDatabase()

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export function isStale(cachedAt: number): boolean {
  return Date.now() - cachedAt > CACHE_TTL_MS
}
