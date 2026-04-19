import { create } from 'zustand'
import type { SatellitePosition } from '../types/satellite.ts'
import type { RawTrackPoint } from '../features/orbit/worker/types.ts'

const TRACK_DURATION_MS = 90 * 60 * 1000
// Keep one point per 25 s to stay near INITIAL_TRACK density
const MIN_TRACK_INTERVAL_MS = 25_000

interface PositionsState {
  positions: Record<number, SatellitePosition>
  tracks: Record<number, RawTrackPoint[]>
  setPositions: (batch: SatellitePosition[]) => void
  setTrack: (noradId: number, points: RawTrackPoint[]) => void
  appendTrackPoint: (noradId: number, point: RawTrackPoint) => void
  remove: (noradId: number) => void
}

export const usePositionsStore = create<PositionsState>((set) => ({
  positions: {},
  tracks: {},

  setPositions: (batch) =>
    set((state) => {
      const next = { ...state.positions }
      for (const pos of batch) next[pos.noradId] = pos
      return { positions: next }
    }),

  setTrack: (noradId, points) =>
    set((state) => ({ tracks: { ...state.tracks, [noradId]: points } })),

  appendTrackPoint: (noradId, point) =>
    set((state) => {
      const existing = state.tracks[noradId] ?? []
      const last = existing[existing.length - 1]
      if (last && point.timestamp - last.timestamp < MIN_TRACK_INTERVAL_MS) return state
      const cutoff = point.timestamp - TRACK_DURATION_MS
      const trimmed = existing.filter((p) => p.timestamp >= cutoff)
      return { tracks: { ...state.tracks, [noradId]: [...trimmed, point] } }
    }),

  remove: (noradId) =>
    set((state) => {
      const positions = { ...state.positions }
      const tracks = { ...state.tracks }
      delete positions[noradId]
      delete tracks[noradId]
      return { positions, tracks }
    }),
}))
