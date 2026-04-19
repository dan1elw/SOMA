import { create } from 'zustand'
import type { ActiveSatellite } from '../types/satellite.ts'

interface ActiveSatellitesState {
  satellites: ActiveSatellite[]
  add: (sat: ActiveSatellite) => void
  remove: (noradId: number) => void
}

export const useActiveSatellitesStore = create<ActiveSatellitesState>((set) => ({
  satellites: [],
  add: (sat) =>
    set((state) => ({
      satellites: state.satellites.some((s) => s.noradId === sat.noradId)
        ? state.satellites
        : [...state.satellites, sat],
    })),
  remove: (noradId) =>
    set((state) => ({
      satellites: state.satellites.filter((s) => s.noradId !== noradId),
    })),
}))
