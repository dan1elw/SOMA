import { create } from 'zustand'

interface UIState {
  selectedNoradId: number | null
  setSelected: (noradId: number | null) => void
  isOffline: boolean
  setOffline: (offline: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedNoradId: null,
  setSelected: (noradId) => set({ selectedNoradId: noradId }),
  isOffline: !navigator.onLine,
  setOffline: (offline) => set({ isOffline: offline }),
}))
