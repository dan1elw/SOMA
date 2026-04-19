import type { OMM } from './omm.ts'

export type OrbitClass = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'UNKNOWN'

export interface ActiveSatellite {
  noradId: number
  name: string
  omm: OMM
  orbitClass: OrbitClass
  addedAt: number
  ommFetchedAt: number
}

export interface SatellitePosition {
  noradId: number
  timestamp: number
  latitude: number
  longitude: number
  altitude: number
  velocity: number
}

export interface GroundTrackSegment {
  coordinates: Array<[number, number]>
}

export interface GroundTrack {
  noradId: number
  segments: GroundTrackSegment[]
  oldestTimestamp: number
  newestTimestamp: number
}

export interface CatalogEntry {
  noradId: number
  name: string
  objectId: string
}
