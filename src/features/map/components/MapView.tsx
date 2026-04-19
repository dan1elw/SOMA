import { useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMap } from '../hooks/useMap'

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  useMap(containerRef)

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
