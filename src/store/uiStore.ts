import { create } from 'zustand'

interface UIState {
  selectedNoradId: number | null
  setSelected: (noradId: number | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  selectedNoradId: null,
  setSelected: (noradId) => set({ selectedNoradId: noradId }),
}))
