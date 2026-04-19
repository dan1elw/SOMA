import { useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMap } from '../hooks/useMap'
import { useIssMarker } from '../hooks/useIssMarker'

export function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useMap(containerRef)
  useIssMarker(mapRef)

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
}
