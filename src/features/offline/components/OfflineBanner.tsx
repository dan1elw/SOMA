import type React from 'react'
import { useUIStore } from '../../../store/uiStore'

export function OfflineBanner(): React.ReactElement | null {
  const isOffline = useUIStore((s) => s.isOffline)

  if (!isOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 rounded-md px-3 py-1.5 text-xs font-medium bg-red-900/80 text-red-200 backdrop-blur-sm"
    >
      You are offline — map tiles and satellite data may be cached
    </div>
  )
}
