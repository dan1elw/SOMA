import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { ActiveSatellite, SatellitePosition } from '../../../types/satellite.ts'
import { useUIStore } from '../../../store/uiStore.ts'

interface Props {
  map: maplibregl.Map
  satellite: ActiveSatellite
  position: SatellitePosition | undefined
}

function createMarkerEl(name: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText = [
    'width:10px',
    'height:10px',
    'border-radius:50%',
    'background:#7dd3fc',
    'border:1.5px solid rgba(255,255,255,0.8)',
    'box-shadow:0 0 6px 2px rgba(125,211,252,0.55)',
    'cursor:pointer',
  ].join(';')
  el.setAttribute('aria-label', name)
  return el
}

export function SatelliteMarker({ map, satellite, position }: Props) {
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const setSelected = useUIStore((s) => s.setSelected)

  // Create the marker hidden; shown once the first position arrives.
  useEffect(() => {
    const el = createMarkerEl(satellite.name)
    el.style.visibility = 'hidden'
    el.style.cursor = 'pointer'
    el.addEventListener('click', () => setSelected(satellite.noradId))
    const marker = new maplibregl.Marker({ element: el }).setLngLat([0, 0]).addTo(map)
    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, satellite.noradId])

  // Update position on every tick
  useEffect(() => {
    if (position && markerRef.current) {
      markerRef.current.setLngLat([position.longitude, position.latitude])
      markerRef.current.getElement().style.visibility = 'visible'
    }
  }, [position])

  return null
}
